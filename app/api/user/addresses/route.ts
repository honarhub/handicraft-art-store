import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { normalizePhoneNumber, isValidIranianMobile } from '@/lib/sms';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ابتدا وارد حساب کاربری شوید' }, { status: 401 });
    }

    const addresses = await prisma.userAddress.findMany({
      where: { userId: session.user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      addresses
    });
  } catch (error) {
    console.error('Addresses GET error:', error);
    return NextResponse.json({ error: 'خطا در دریافت لیست آدرس‌ها' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ابتدا وارد حساب کاربری شوید' }, { status: 401 });
    }

    const body = await req.json();
    const { title, recipientName, phoneNumber, province, city, address, postalCode, isDefault } = body;

    if (!recipientName?.trim()) {
      return NextResponse.json({ error: 'نام و نام خانوادگی تحویل‌گیرنده الزامی است' }, { status: 400 });
    }

    const normalizedPhone = normalizePhoneNumber(phoneNumber || '');
    if (!isValidIranianMobile(normalizedPhone)) {
      return NextResponse.json({ error: 'شماره تماس تحویل‌گیرنده نامعتبر است (مثال: ۰۹۱۲۳۴۵۶۷۸۹)' }, { status: 400 });
    }

    if (!province?.trim() || !city?.trim()) {
      return NextResponse.json({ error: 'انتخاب استان و شهر الزامی است' }, { status: 400 });
    }

    if (!address?.trim() || address.trim().length < 8) {
      return NextResponse.json({ error: 'نشانی پستی دقیق الزامی است (حداقل ۸ حرف)' }, { status: 400 });
    }

    // Convert Persian/Arabic digits in postal code
    const cleanPostal = (postalCode || '').toString().trim().replace(/[۰-۹]/g, (d: string) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
    if (cleanPostal && cleanPostal.length !== 10) {
      return NextResponse.json({ error: 'کد پستی باید دقیقاً ۱۰ رقمی باشد' }, { status: 400 });
    }

    // Check if this is the user's first address
    const count = await prisma.userAddress.count({
      where: { userId: session.user.id }
    });
    const shouldBeDefault = Boolean(isDefault) || count === 0;

    if (shouldBeDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false }
      });
    }

    const newAddress = await prisma.userAddress.create({
      data: {
        userId: session.user.id,
        title: title?.trim() || 'آدرس من',
        recipientName: recipientName.trim(),
        phoneNumber: normalizedPhone,
        province: province.trim(),
        city: city.trim(),
        address: address.trim(),
        postalCode: cleanPostal,
        isDefault: shouldBeDefault
      }
    });

    return NextResponse.json({
      success: true,
      address: newAddress
    });
  } catch (error) {
    console.error('Addresses POST error:', error);
    return NextResponse.json({ error: 'خطا در ثبت آدرس جدید' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ابتدا وارد حساب کاربری شوید' }, { status: 401 });
    }

    const body = await req.json();
    const { id, title, recipientName, phoneNumber, province, city, address, postalCode, isDefault } = body;

    if (!id) {
      return NextResponse.json({ error: 'شناسه آدرس الزامی است' }, { status: 400 });
    }

    const existing = await prisma.userAddress.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'آدرس مورد نظر یافت نشد' }, { status: 404 });
    }

    if (isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: session.user.id },
        data: { isDefault: false }
      });
    }

    const normalizedPhone = phoneNumber ? normalizePhoneNumber(phoneNumber) : existing.phoneNumber;
    const cleanPostal = postalCode !== undefined 
      ? postalCode.toString().trim().replace(/[۰-۹]/g, (d: string) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString())
      : existing.postalCode;

    const updated = await prisma.userAddress.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : existing.title,
        recipientName: recipientName !== undefined ? recipientName.trim() : existing.recipientName,
        phoneNumber: normalizedPhone,
        province: province !== undefined ? province.trim() : existing.province,
        city: city !== undefined ? city.trim() : existing.city,
        address: address !== undefined ? address.trim() : existing.address,
        postalCode: cleanPostal,
        isDefault: isDefault !== undefined ? Boolean(isDefault) : existing.isDefault
      }
    });

    return NextResponse.json({
      success: true,
      address: updated
    });
  } catch (error) {
    console.error('Addresses PUT error:', error);
    return NextResponse.json({ error: 'خطا در ویرایش آدرس' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'ابتدا وارد حساب کاربری شوید' }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'شناسه آدرس الزامی است' }, { status: 400 });
    }

    await prisma.userAddress.deleteMany({
      where: { id, userId: session.user.id }
    });

    return NextResponse.json({
      success: true,
      message: 'آدرس با موفقیت حذف شد'
    });
  } catch (error) {
    console.error('Addresses DELETE error:', error);
    return NextResponse.json({ error: 'خطا در حذف آدرس' }, { status: 500 });
  }
}
