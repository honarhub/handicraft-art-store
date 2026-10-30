import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { normalizePhoneNumber, isValidIranianMobile, testSmsIrConnection } from '@/lib/sms';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز. فقط مدیر سیستم مجاز به ارسال پیامک تستی است.' }, { status: 403 });
    }

    const body = await req.json();
    const { phone, apiKey, templateId, paramName } = body;

    if (!phone) {
      return NextResponse.json({ error: 'شماره تلفن همراه الزامی است.' }, { status: 400 });
    }

    const normalized = normalizePhoneNumber(phone);
    if (!isValidIranianMobile(normalized)) {
      return NextResponse.json({ error: 'شماره تلفن همراه نامعتبر است. فرمت صحیح: ۰۹۱۲۳۴۵۶۷۸۹' }, { status: 400 });
    }

    // Load from settings if not supplied in test form
    let keyToUse = apiKey?.trim();
    let templateToUse = templateId?.toString().trim();
    let paramNameToUse = paramName?.trim() || 'Code';

    if (!keyToUse || !templateToUse) {
      const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
      if (!keyToUse) keyToUse = settings?.smsApiKey || process.env.SMSIR_API_KEY || null;
      if (!templateToUse) templateToUse = settings?.smsTemplateId || process.env.SMSIR_TEMPLATE_ID || null;
      if (settings?.smsOtpParamName) paramNameToUse = settings.smsOtpParamName;
    }

    if (!keyToUse) {
      return NextResponse.json({ error: 'کلید API وارد نشده است. لطفاً ابتدا کلید sms.ir را وارد یا ذخیره کنید.' }, { status: 400 });
    }

    if (!templateToUse) {
      return NextResponse.json({ error: 'شناسه قالب (Template ID) وارد نشده است.' }, { status: 400 });
    }

    const testCode = Math.floor(10000 + Math.random() * 90000).toString();

    const result = await testSmsIrConnection({
      mobile: normalized,
      testCode,
      apiKey: keyToUse,
      templateId: templateToUse,
      paramName: paramNameToUse
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `پیامک تستی اعتبارسنجی با کد ${testCode} با موفقیت از طریق sms.ir ارسال شد.`,
        data: {
          messageId: result.messageId,
          cost: result.cost,
          testCode,
          receptor: normalized
        }
      });
    }

    return NextResponse.json({
      success: false,
      error: result.error || 'خطا در ارسال پیامک از طریق سامانه sms.ir'
    }, { status: 400 });

  } catch (error: any) {
    console.error('[SMS Test Error]', error);
    return NextResponse.json({ error: error.message || 'خطای سرور در ارسال پیامک تست.' }, { status: 500 });
  }
}
