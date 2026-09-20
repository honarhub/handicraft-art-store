import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'ایمیل الزامی است' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // به دلایل امنیتی، نمی‌گوییم کاربر وجود ندارد
      return NextResponse.json({ success: true, message: 'اگر ایمیل معتبر باشد، لینک بازیابی ارسال شد.' });
    }

    // تولید توکن تصادفی
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 ساعت اعتبار

    // پاک کردن توکن‌های قبلی کاربر اگر وجود دارد (اختیاری)
    await prisma.passwordResetToken.deleteMany({
      where: { email }
    });

    await prisma.passwordResetToken.create({
      data: {
        email,
        token,
        expiresAt
      }
    });

    // در یک پروژه واقعی اینجا ایمیل ارسال می‌شود
    const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
    
    // شبیه‌سازی ارسال ایمیل در محیط تست
    console.log('=============================================');
    console.log('🔔 EMAIL MOCK - PASSWORD RESET LINK');
    console.log(`To: ${email}`);
    console.log(`Link: ${resetLink}`);
    console.log('=============================================');

    return NextResponse.json({ 
      success: true, 
      message: 'لینک بازیابی ایجاد شد. (در کنسول سرور چاپ شد)' 
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
