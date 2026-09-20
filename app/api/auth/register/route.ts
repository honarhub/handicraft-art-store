import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, role = 'ARTIST' } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'نام، ایمیل و رمز عبور الزامی است' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json({ error: 'این ایمیل قبلاً ثبت شده است' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role,
        ...(role === 'ARTIST' ? {
          artistProfile: {
            create: {
              isApproved: false,
              isActive: false, // Not active on site yet because isApproved is false
            }
          }
        } : {})
      },
      include: {
        artistProfile: true
      }
    });

    return NextResponse.json({ 
      success: true, 
      message: 'ثبت‌نام با موفقیت انجام شد',
      user: { id: newUser.id, name: newUser.name, email: newUser.email }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'خطا در ثبت‌نام. لطفا دوباره تلاش کنید.', details: error.message }, { status: 500 });
  }
}
