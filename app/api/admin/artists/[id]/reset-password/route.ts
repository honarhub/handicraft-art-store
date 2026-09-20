import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);

    // BYPASS CHECK FOR TESTING
    // if (!session) {
    //   return NextResponse.json({ error: 'شما لاگین نکرده‌اید' }, { status: 401 });
    // }
    //
    // if (session.user.role !== 'ADMIN') {
    //   return NextResponse.json({ error: `دسترسی غیرمجاز - نقش شما در سیستم ${session.user.role || 'نامشخص'} است` }, { status: 403 });
    // }

    const { newPassword, email } = await request.json();

    if (newPassword && newPassword.length > 0 && newPassword.length < 6) {
      return NextResponse.json({ error: 'رمز عبور کوتاه است' }, { status: 400 });
    }

    // Allow email to be empty (null in db)
    const processedEmail = email && email.trim() !== '' ? email.trim() : null;

    const artist = await prisma.artistProfile.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!artist || !artist.userId) {
      return NextResponse.json({ error: 'هنرمند یافت نشد' }, { status: 404 });
    }

    let updateData: any = {};
    
    // Only update email if it was provided or explicitly cleared
    if (processedEmail !== undefined) {
      updateData.email = processedEmail;
    }
    
    if (newPassword && newPassword.length >= 6) {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
      updateData.mustChangePassword = true;
    }

    await prisma.user.update({
      where: { id: artist.userId },
      data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error resetting artist password by admin:', error);
    
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return NextResponse.json({ error: 'این ایمیل قبلا در سیستم ثبت شده است (تکراری است).' }, { status: 400 });
    }
    
    return NextResponse.json({ error: error.message || 'خطای سرور' }, { status: 500 });
  }
}
