import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { normalizePhoneNumber } from "@/lib/sms";

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
        phone: { label: "شماره موبایل", type: "text" },
        code: { label: "کد تایید", type: "text" },
        loginType: { type: "hidden" }
      },
      async authorize(credentials) {
        // --- 1. Mobile Phone or Email + OTP Login ---
        if (credentials?.loginType === 'otp' || ((credentials?.phone || credentials?.email) && credentials?.code)) {
          const isEmail = Boolean(credentials?.email && !credentials?.phone);
          const rawTarget = isEmail ? credentials.email : credentials.phone;
          if (!rawTarget || !credentials.code) {
            throw new Error(isEmail ? "ایمیل و کد تایید الزامی است." : "شماره موبایل و کد تایید الزامی است.");
          }

          const normalized = isEmail ? rawTarget.trim().toLowerCase() : normalizePhoneNumber(rawTarget);
          const cleanedCode = credentials.code.trim();

          const record = await prisma.verificationCode.findFirst({
            where: {
              target: normalized,
              code: cleanedCode,
              type: { in: ['PHONE_OTP', 'EMAIL_OTP', 'REGISTER_OTP'] },
              used: false,
              expiresAt: { gte: new Date() }
            },
            orderBy: { createdAt: 'desc' }
          });

          if (!record) {
            throw new Error("کد تایید اشتباه است یا منقضی شده است.");
          }

          // Invalidate used code
          await prisma.verificationCode.update({
            where: { id: record.id },
            data: { used: true }
          });

          // Find User - MUST exist in DB (no auto-creation on login!)
          const user = await prisma.user.findFirst({
            where: isEmail ? { email: normalized } : { phoneNumber: normalized },
            include: { artistProfile: true }
          });

          if (!user) {
            throw new Error(isEmail ? "این ایمیل در سیستم ثبت نشده است. لطفاً ابتدا ثبت‌نام کنید." : "این شماره موبایل در سیستم ثبت نشده است. لطفاً ابتدا ثبت‌نام کنید.");
          }

          if (user.role !== 'ARTIST' && user.role !== 'ADMIN') {
            throw new Error("این حساب کاربری دسترسی به پنل هنرمندان را ندارد.");
          }

          if (user.artistProfile?.isDeleted) {
            throw new Error("حساب کاربری هنرمندی شما بایگانی شده است. لطفاً با پشتیبانی در تماس باشید.");
          }

          if (user.artistProfile && !user.artistProfile.isActive && user.role !== 'ADMIN') {
            throw new Error("حساب کاربری هنرمندی شما توسط ادمین غیرفعال شده است. لطفاً با پشتیبانی در تماس باشید.");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }

        // --- 2. Mobile Phone + Password Login ---
        if (credentials?.phone && credentials?.password && !credentials?.code) {
          const normalized = normalizePhoneNumber(credentials.phone);
          const user = await prisma.user.findFirst({
            where: { phoneNumber: normalized },
            include: { artistProfile: true }
          });

          if (!user) {
            throw new Error("این شماره موبایل در سیستم ثبت نشده است. لطفاً ابتدا ثبت‌نام کنید.");
          }

          if (!user.password) {
            throw new Error("برای این حساب رمز عبور تعیین نشده است. لطفاً با رمز یکبار مصرف پیامکی وارد شوید یا از فراموشی رمز عبور استفاده نمایید.");
          }

          let isPasswordValid = false;
          try {
            isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          } catch {
            isPasswordValid = false;
          }

          if (!isPasswordValid && credentials.password === user.password) {
            isPasswordValid = true;
            const newHash = await bcrypt.hash(credentials.password, 10);
            await prisma.user.update({
              where: { id: user.id },
              data: { password: newHash }
            });
          }

          if (!isPasswordValid) {
            throw new Error("رمز عبور اشتباه است.");
          }

          if (user.role !== 'ARTIST' && user.role !== 'ADMIN') {
            throw new Error("این حساب کاربری دسترسی به پنل هنرمندان را ندارد.");
          }

          if (user.artistProfile?.isDeleted) {
            throw new Error("حساب کاربری هنرمندی شما بایگانی شده است. لطفاً با پشتیبانی در تماس باشید.");
          }

          if (user.artistProfile && !user.artistProfile.isActive && user.role !== 'ADMIN') {
            throw new Error("حساب کاربری هنرمندی شما توسط ادمین غیرفعال شده است. لطفاً با پشتیبانی در تماس باشید.");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        }

        // --- 3. Standard Email + Password Login ---
        if (!credentials?.email || !credentials?.password) {
          throw new Error("ایمیل و رمز عبور الزامی است");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.trim().toLowerCase() },
          include: { artistProfile: true }
        });

        if (!user) {
          throw new Error("این ایمیل در سیستم ثبت نشده است. لطفاً ابتدا ثبت‌نام کنید.");
        }

        if (!user.password) {
          throw new Error("برای این حساب رمز عبور تعریف نشده است. در صورت ثبت نام با گوگل یا موبایل، از آن طریق اقدام کنید.");
        }

        let isPasswordValid = false;
        try {
          isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        } catch {
          isPasswordValid = false;
        }

        // Support fallback if password was stored in plain text and auto-upgrade to hash
        if (!isPasswordValid && credentials.password === user.password) {
          isPasswordValid = true;
          const newHash = await bcrypt.hash(credentials.password, 10);
          await prisma.user.update({
            where: { id: user.id },
            data: { password: newHash }
          });
        }

        if (!isPasswordValid) {
          throw new Error("رمز عبور اشتباه است.");
        }

        if (credentials.loginType === 'admin' && user.role !== 'ADMIN') {
          throw new Error("شما دسترسی ورود به پنل ادمین را ندارید");
        }

        if (credentials.loginType === 'artist') {
          if (user.role !== 'ARTIST' && user.role !== 'ADMIN') {
            throw new Error("این حساب کاربری دسترسی به پنل هنرمندان را ندارد");
          }
          let artist = user.artistProfile;
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
            throw new Error("حساب کاربری هنرمندی شما بایگانی شده است. لطفاً با پشتیبانی در تماس باشید.");
          }
          if (!artist.isActive && user.role !== 'ADMIN') {
            throw new Error("حساب کاربری هنرمندی شما توسط ادمین غیرفعال شده است. لطفاً با پشتیبانی در تماس باشید.");
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
        const googleEmail = (profile?.email || user.email)?.trim().toLowerCase();
        const googleName = (profile as any)?.name || user.name;
        const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const isAdmin = Boolean(adminEmail && googleEmail === adminEmail);
        
        // Find existing user by exact email
        let dbUser = await prisma.user.findUnique({
          where: { email: googleEmail },
          include: { artistProfile: true }
        });

        if (dbUser) {
          // If the user has no name or a generic default name, sync from Google profile
          if (googleName && (!dbUser.name || dbUser.name.startsWith('هنرمند'))) {
            await prisma.user.update({
              where: { id: dbUser.id },
              data: { name: googleName }
            });
            user.name = googleName;
          }

          // Ensure the Google account is strictly linked to THIS user and not a previous user session
          if (account.providerAccountId) {
            await prisma.account.deleteMany({
              where: {
                provider: 'google',
                providerAccountId: account.providerAccountId,
                NOT: { userId: dbUser.id }
              }
            });
          }

          if (isAdmin) {
            user.role = 'ADMIN';
            if (dbUser.role !== 'ADMIN') {
              await prisma.user.update({
                where: { id: dbUser.id },
                data: { role: 'ADMIN' }
              });
            }
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
          } else {
            if (dbUser.artistProfile?.isDeleted) {
              return '/artist-panel/login?error=archived';
            }
            if (dbUser.artistProfile && !dbUser.artistProfile.isActive) {
              return '/artist-panel/login?error=deactivated';
            }
            if (!dbUser.artistProfile) {
              await prisma.artistProfile.create({
                data: {
                  userId: dbUser.id,
                  isApproved: false,
                  isActive: true,
                  verificationLevel: 0
                }
              });
            }
            user.role = dbUser.role || 'ARTIST';
          }
        } else {
          if (!isAdmin) {
            const redirectEmail = encodeURIComponent(googleEmail);
            return `/artist-panel/login?error=not_registered&email=${redirectEmail}`;
          }
          user.role = 'ADMIN';
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        if (user.name) token.name = user.name;
        if (user.email) token.email = user.email;
      }
      if (trigger === "update" && session?.role) {
        token.role = session.role;
      }
      
      // Look up user by id or by email to ensure token stays in sync with actual DB record
      const lookupFilter = token.id
        ? { id: token.id as string }
        : (token.email ? { email: token.email as string } : null);

      if (lookupFilter && trigger !== 'update') {
        const dbUser = await prisma.user.findUnique({
          where: lookupFilter,
          select: { 
            id: true, 
            name: true, 
            role: true, 
            email: true, 
            artistProfile: { select: { id: true, isDeleted: true } } 
          }
        });
        if (!dbUser || dbUser.artistProfile?.isDeleted) {
          // Invalidate session cleanly if user or artist is deleted
          return {} as any;
        }
        
        token.id = dbUser.id;
        token.name = dbUser.name;
        token.email = dbUser.email;
        
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
                isActive: true,
                verificationLevel: 0
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
        if (token.name) session.user.name = token.name as string;
        if (token.email) session.user.email = token.email as string;
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
