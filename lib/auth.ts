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
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: profile.email === process.env.ADMIN_EMAIL ? 'ADMIN' : 'USER'
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
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email as string }
          });
          if (dbUser && dbUser.role !== 'ADMIN') {
            await prisma.user.update({
              where: { email: user.email },
              data: { role: 'ADMIN' }
            });
          }
          user.role = 'ADMIN';
        } else {
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email as string },
            select: { role: true }
          });
          if (dbUser) {
            user.role = dbUser.role;
          } else {
            user.role = 'USER';
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
      // Verify user still exists in database on every token refresh
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { id: true, role: true }
        });
        if (!dbUser) {
          return null as any; // Invalidate session if user no longer exists
        }
        // Keep role in sync with database
        token.role = dbUser.role;
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
    signIn: '/login-switcher',
    error: '/login-error', 
  },
  secret: process.env.NEXTAUTH_SECRET,
};
