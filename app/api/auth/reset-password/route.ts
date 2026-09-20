import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'اطلاعات ناقص است' }, { status: 400 });
    }

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token }
    });

    if (!resetToken) {
      return NextResponse.json({ error: 'لینک بازیابی نامعتبر است' }, { status: 400 });
    }

    if (resetToken.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { token } });
      return NextResponse.json({ error: 'لینک بازیابی منقضی شده است' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // آپدیت پسورد کاربر
    await prisma.user.update({
      where: { email: resetToken.email },
      data: { password: hashedPassword }
    });

    // حذف توکن مصرف شده
    await prisma.passwordResetToken.delete({ where: { token } });

    return NextResponse.json({ success: true, message: 'رمز عبور با موفقیت تغییر کرد' });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
