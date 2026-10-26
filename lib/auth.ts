import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "select_account",
          access_type: "offline",
          response_type: "code"
        }
      },
      profile(profile) {
        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const userEmail = profile.email?.trim().toLowerCase();
        const isAdmin = Boolean(adminEmail && userEmail === adminEmail);
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: isAdmin ? 'ADMIN' : 'ARTIST'
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
          let artist = await prisma.artistProfile.findUnique({
            where: { userId: user.id }
          });
          // Auto-create artist profile for admin if testing artist panel
          if (!artist && user.role === 'ADMIN') {
            artist = await prisma.artistProfile.create({
              data: {
                userId: user.id,
                isApproved: true,
                isActive: true,
                bio: 'مدیر کل سیستم (Master Admin)',
              }
            });
          }
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
        
        // If signing-in user is system administrator
        if (adminEmail && user.email === adminEmail) {
          user.role = 'ADMIN';
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email as string },
            include: { artistProfile: true }
          });
          if (dbUser) {
            if (dbUser.role !== 'ADMIN') {
              await prisma.user.update({
                where: { email: user.email },
                data: { role: 'ADMIN' }
              });
            }
            // Ensure admin also has an active artist profile for panel access
            if (!dbUser.artistProfile) {
              await prisma.artistProfile.create({
                data: {
                  userId: dbUser.id,
                  isApproved: true,
                  isActive: true,
                  bio: 'مدیر کل سیستم (Master Admin)',
                }
              });
            }
          }
        } else {
          // For regular artists and OAuth users
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
      // Verify user exists and keep role in sync with database
      if (token.id && trigger !== 'update') {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, role: true, email: true, artistProfile: { select: { id: true } } }
        });
        if (!dbUser) {
          // Invalidate session cleanly if user is deleted
          return {} as any;
        }
        
        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const userEmail = dbUser.email?.trim().toLowerCase();
        
        if (adminEmail && userEmail === adminEmail) {
          if (dbUser.role !== 'ADMIN') {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { role: 'ADMIN' }
            });
          }
          token.role = 'ADMIN';
        } else {
          // Auto-create artist profile for new ARTIST users if missing
          if (dbUser.role === 'ARTIST' && !dbUser.artistProfile) {
            await prisma.artistProfile.create({
              data: {
                userId: dbUser.id,
                isApproved: false,
                isActive: false,
              }
            });
          }
          
          // Keep role in sync with database
          token.role = dbUser.role;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session?.user) {
        if (token.id) session.user.id = token.id as string;
        if (token.role) session.user.role = token.role as string;
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
