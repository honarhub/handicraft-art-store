import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { testResendConnection } from '@/lib/email';

export async function POST(req: Request) {
  try {
    // Admin authentication check
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    if (!session || userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز. فقط مدیر سیستم مجاز به ارسال تست است.' }, { status: 403 });
    }

    const body = await req.json();
    const { toEmail, apiKey, fromEmail, fromName } = body;

    if (!toEmail || !toEmail.includes('@')) {
      return NextResponse.json({ error: 'لطفاً یک آدرس ایمیل معتبر برای دریافت تست وارد کنید.' }, { status: 400 });
    }

    // Determine credentials to use
    let keyToUse = apiKey ? apiKey.trim() : null;
    let fromEmailToUse = fromEmail ? fromEmail.trim() : null;
    let fromNameToUse = fromName ? fromName.trim() : 'هنرهاب';

    if (!keyToUse || !fromEmailToUse) {
      const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
      if (!keyToUse && settings?.resendApiKey) keyToUse = settings.resendApiKey;
      if (!fromEmailToUse && settings?.emailFromAddress) fromEmailToUse = settings.emailFromAddress;
      if (settings?.emailFromName) fromNameToUse = settings.emailFromName;
    }

    if (!keyToUse) {
      return NextResponse.json({ error: 'کلید Resend API Key وارد نشده است. لطفاً ابتدا کلید اختصاصی خود را وارد نمایید.' }, { status: 400 });
    }

    if (!fromEmailToUse) {
      fromEmailToUse = 'no-reply@honarhub.ir';
    }

    const result = await testResendConnection({
      apiKey: keyToUse,
      fromEmail: fromEmailToUse,
      fromName: fromNameToUse,
      toEmail: toEmail.trim()
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `ایمیل تستی با موفقیت از طریق Resend به آدرس ${toEmail} ارسال شد.`,
        data: {
          id: result.id,
          from: `${fromNameToUse} <${fromEmailToUse}>`,
          to: toEmail.trim()
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'خطا در ارسال ایمیل تستی از طریق سرویس Resend.'
      }, { status: 502 });
    }
  } catch (error: any) {
    console.error('[API /api/admin/settings/email-test] Error:', error);
    return NextResponse.json({ error: 'خطای سیستمی در ارسال ایمیل تستی: ' + error.message }, { status: 500 });
  }
}
