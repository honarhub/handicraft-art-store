import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: profile.email === process.env.ADMIN_EMAIL ? 'ADMIN' : 'ARTIST'
        }
      }
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "ایمیل", type: "email", placeholder: "you@example.com" },
        password: { label: "رمز عبور", type: "password" },
        loginType: { type: "hidden" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("ایمیل و رمز عبور الزامی است");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user || !user.password) {
          throw new Error("کاربری با این مشخصات یافت نشد");
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error("رمز عبور اشتباه است");
        }

        if (credentials.loginType === 'admin' && user.role !== 'ADMIN') {
          throw new Error("شما دسترسی ورود به پنل ادمین را ندارید");
        }

        if (credentials.loginType === 'artist') {
          if (user.role !== 'ARTIST' && user.role !== 'ADMIN') {
            throw new Error("این حساب کاربری دسترسی به پنل هنرمندان را ندارد");
          }
          const artist = await prisma.artistProfile.findUnique({
            where: { userId: user.id }
          });
          if (!artist) {
            throw new Error("پروفایل هنرمند برای این حساب یافت نشد. لطفاً ابتدا ثبت‌نام کنید.");
          }
          if (artist.isDeleted) {
            throw new Error("حساب هنرمندی شما غیرفعال یا حذف شده است. لطفاً با پشتیبانی تماس بگیرید.");
          }
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google') {
        const adminEmail = process.env.ADMIN_EMAIL;
        
        // اگر کاربر لاگین کننده ادمین است
        if (adminEmail && user.email === adminEmail) {
          user.role = 'ADMIN';
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email as string }
          });
          if (dbUser && dbUser.role !== 'ADMIN') {
            await prisma.user.update({
              where: { email: user.email },
              data: { role: 'ADMIN' }
            });
          }
        } else {
          // برای سایر کاربران (ورود از پنل هنرمند)
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email as string },
            include: { artistProfile: true }
          });
          if (dbUser) {
            if (!dbUser.artistProfile) {
              await prisma.artistProfile.create({
                data: {
                  userId: dbUser.id,
                  isApproved: false,
                  isActive: false,
                }
              });
              await prisma.user.update({
                where: { id: dbUser.id },
                data: { role: 'ARTIST' }
              });
              user.role = 'ARTIST';
            } else {
              user.role = dbUser.role;
            }
          } else {
            user.role = 'ARTIST';
          }
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }
      // Verify user still exists in database and keep role/profile in sync
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: { artistProfile: true }
        });
        if (!dbUser) {
          return null as any; // Invalidate session if user no longer exists
        }
        
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail && dbUser.email === adminEmail) {
          if (dbUser.role !== 'ADMIN') {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { role: 'ADMIN' }
            });
          }
          token.role = 'ADMIN';
        } else {
          // اگر کاربر غیرادمین پروفایل هنرمند ندارد، ایجاد خودکار پروفایل هنرمند
          if (!dbUser.artistProfile) {
            await prisma.artistProfile.create({
              data: {
                userId: dbUser.id,
                isApproved: false,
                isActive: false,
              }
            });
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { role: 'ARTIST' }
            });
            token.role = 'ARTIST';
          } else {
            token.role = dbUser.role;
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/artist-panel/login',
    error: '/login-error',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
