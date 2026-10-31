import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateRandomCode, getCanonicalBaseUrl } from '@/lib/referral';
import { isValidIranianMobile, normalizePhoneNumber, sendReferralInviteSms } from '@/lib/sms';
import { sendReferralInviteEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی فقط برای مدیر کل سیستم مجاز است.' }, { status: 403 });
    }

    const body = await req.json();
    const { target, channel = 'auto', code: clientProvidedCode, isCustom = false } = body;

    if (!target || typeof target !== 'string' || !target.trim()) {
      return NextResponse.json({ error: 'لطفاً شماره موبایل یا آدرس ایمیل متقاضی را وارد کنید.' }, { status: 400 });
    }

    const cleanTarget = target.trim();
    const isEmailLike = cleanTarget.includes('@');
    const isPhoneLike = cleanTarget.startsWith('09') || cleanTarget.startsWith('+98') || cleanTarget.startsWith('98') || /^\d{10,11}$/.test(cleanTarget.replace(/\s+/g, ''));

    let activeChannel: 'sms' | 'email' = 'sms';
    if (channel === 'email' || (channel === 'auto' && isEmailLike)) {
      activeChannel = 'email';
    } else if (channel === 'sms' || (channel === 'auto' && isPhoneLike)) {
      activeChannel = 'sms';
    } else if (isEmailLike) {
      activeChannel = 'email';
    } else {
      activeChannel = 'sms';
    }

    // Pre-validation of target before generating code
    let normalizedPhone = '';
    if (activeChannel === 'sms') {
      normalizedPhone = normalizePhoneNumber(cleanTarget);
      if (!isValidIranianMobile(normalizedPhone)) {
        return NextResponse.json({ error: 'شماره موبایل نامعتبر است (نمونه صحیح: 09121234567).' }, { status: 400 });
      }
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanTarget.toLowerCase())) {
        return NextResponse.json({ error: 'فرمت آدرس ایمیل وارد شده نامعتبر است.' }, { status: 400 });
      }
    }

    // 1. Determine unique referral code (custom code validation OR random code generation)
    let newCode = '';
    if (clientProvidedCode && typeof clientProvidedCode === 'string' && clientProvidedCode.trim()) {
      const candidate = clientProvidedCode.trim().toUpperCase();

      if (isCustom) {
        if (candidate.length < 3) {
          return NextResponse.json({ error: 'کد سفارشی باید حداقل ۳ کاراکتر باشد.' }, { status: 400 });
        }
        if (candidate.length > 25) {
          return NextResponse.json({ error: 'طول کد سفارشی حداکثر می‌تواند ۲۵ کاراکتر باشد (محدودیت سامانه پیامک).' }, { status: 400 });
        }
        if (/\s/.test(candidate)) {
          return NextResponse.json({ error: 'کد سفارشی نمی‌تواند حاوی فاصله باشد.' }, { status: 400 });
        }
      }

      const existing = await prisma.referralCode.findUnique({ where: { code: candidate } });
      if (existing) {
        if (isCustom) {
          return NextResponse.json({ error: `کد معرف «${candidate}» قبلاً در سیستم ثبت شده و تکراری است. لطفاً کد دیگری انتخاب کنید.` }, { status: 400 });
        }
        // If not custom (was previewed random), let it fall through to generate a new unique code below
      } else {
        newCode = candidate;
      }
    }

    if (!newCode) {
      let isUnique = false;
      while (!isUnique) {
        const candidate = generateRandomCode();
        const existing = await prisma.referralCode.findUnique({ where: { code: candidate } });
        if (!existing) {
          newCode = candidate;
          isUnique = true;
        }
      }
    }

    // 2. Create the code under Master Admin
    const createdReferral = await prisma.referralCode.create({
      data: {
        code: newCode,
        creatorId: session.user.id,
        isUsed: false
      }
    });

    // 3. Construct canonical registration link (supports both invite and ref for full compatibility)
    const baseUrl = getCanonicalBaseUrl(req);
    const registerUrl = `${baseUrl}/artist-panel/login?invite=${encodeURIComponent(newCode)}&ref=${encodeURIComponent(newCode)}&tab=register`;

    // 4. Send via SMS or Email
    if (activeChannel === 'sms') {
      const smsResult = await sendReferralInviteSms({
        mobile: normalizedPhone,
        referralCode: newCode,
        registerUrl
      });

      if (!smsResult.success) {
        // Rollback created referral code to maintain clean database records
        await prisma.referralCode.delete({ where: { id: createdReferral.id } });
        return NextResponse.json({ error: smsResult.error || 'خطا در ارسال پیامک دعوت‌نامه' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `کد معرف «${newCode}» با موفقیت صادر و از طریق پیامک به شماره ${normalizedPhone} ارسال شد.`,
        code: createdReferral,
        channel: 'sms',
        target: normalizedPhone
      });
    } else {
      const emailResult = await sendReferralInviteEmail({
        toEmail: cleanTarget,
        referralCode: newCode,
        registerUrl,
        senderName: 'مدیریت سایت'
      });

      if (!emailResult.success) {
        // Rollback created referral code
        await prisma.referralCode.delete({ where: { id: createdReferral.id } });
        return NextResponse.json({ error: emailResult.error || 'خطا در ارسال ایمیل دعوت‌نامه' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `کد معرف «${newCode}» با موفقیت صادر و از طریق ایمیل به ${cleanTarget.toLowerCase()} ارسال شد.`,
        code: createdReferral,
        channel: 'email',
        target: cleanTarget.toLowerCase()
      });
    }
  } catch (error: any) {
    console.error('Quick send referral error:', error);
    return NextResponse.json({ error: 'خطای غیرمنتظره در صدور و ارسال کد معرف' }, { status: 500 });
  }
}
