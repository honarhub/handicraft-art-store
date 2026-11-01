import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { 
  normalizePhoneNumber, 
  isValidIranianMobile, 
  testSmsIrConnection,
  testFarazSmsConnection,
  checkFarazSmsBalance 
} from '@/lib/sms';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز. فقط مدیر سیستم مجاز به ارسال پیامک تستی است.' }, { status: 403 });
    }

    const body = await req.json();
    const { 
      provider,
      phone, 
      apiKey, 
      templateId, 
      paramName,
      // FarazSMS
      farazApiKey,
      farazLineNumber,
      farazPatternCode,
      farazOtpParamName,
      action // optional action: 'balance' to just check credit
    } = body;

    const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
    const activeProvider = provider || settings?.smsProvider || 'sms.ir';

    // Dedicated action to check FarazSMS balance
    if (action === 'check_balance') {
      const key = farazApiKey?.trim() || settings?.farazSmsApiKey || process.env.FARAZSMS_API_KEY;
      if (!key) {
        return NextResponse.json({ error: 'کلید Api-Key فراز اس‌ام‌اس وارد نشده است.' }, { status: 400 });
      }
      const balRes = await checkFarazSmsBalance(key);
      if (balRes.success) {
        return NextResponse.json({
          success: true,
          balance: balRes.balance,
          message: `موجودی پنل فراز اس‌ام‌اس: ${balRes.balance?.toLocaleString('fa-IR')} ریال`
        });
      }
      return NextResponse.json({ error: balRes.error || 'خطا در دریافت موجودی' }, { status: 400 });
    }

    if (!phone) {
      return NextResponse.json({ error: 'شماره تلفن همراه الزامی است.' }, { status: 400 });
    }

    const normalized = normalizePhoneNumber(phone);
    if (!isValidIranianMobile(normalized)) {
      return NextResponse.json({ error: 'شماره تلفن همراه نامعتبر است. فرمت صحیح: ۰۹۱۲۳۴۵۶۷۸۹' }, { status: 400 });
    }

    const testCode = Math.floor(10000 + Math.random() * 90000).toString();

    // 1. Test FarazSMS
    if (activeProvider === 'farazsms') {
      const keyToUse = farazApiKey?.trim() || settings?.farazSmsApiKey || process.env.FARAZSMS_API_KEY || null;
      const lineToUse = farazLineNumber?.trim() || settings?.farazSmsLineNumber || process.env.FARAZSMS_LINE_NUMBER || null;
      const patternToUse = farazPatternCode?.trim() || settings?.farazSmsPatternCode || process.env.FARAZSMS_PATTERN_CODE || null;
      const paramNameToUse = farazOtpParamName?.trim() || settings?.farazSmsOtpParamName || 'code';

      if (!keyToUse) {
        return NextResponse.json({ error: 'کلید Api-Key فراز اس‌ام‌اس وارد نشده است.' }, { status: 400 });
      }
      if (!lineToUse) {
        return NextResponse.json({ error: 'شماره خط فرستنده (line_number) فراز اس‌ام‌اس مشخص نشده است.' }, { status: 400 });
      }
      if (!patternToUse) {
        return NextResponse.json({ error: 'کد الگوی (Pattern Code) فراز اس‌ام‌اس وارد نشده است.' }, { status: 400 });
      }

      const result = await testFarazSmsConnection({
        mobile: normalized,
        testCode,
        apiKey: keyToUse,
        lineNumber: lineToUse,
        patternCode: patternToUse,
        paramName: paramNameToUse
      });

      if (result.success) {
        return NextResponse.json({
          success: true,
          message: `پیامک تستی اعتبارسنجی با کد ${testCode} با موفقیت از طریق فراز اس‌ام‌اس (IranPayamak) ارسال شد.`,
          data: {
            provider: 'farazsms',
            messageId: result.messageId,
            testCode,
            receptor: normalized,
            balance: result.balance
          }
        });
      }

      return NextResponse.json({
        success: false,
        error: result.error || 'خطا در ارسال پیامک از طریق سامانه فراز اس‌ام‌اس'
      }, { status: 400 });
    }

    // 2. Test SMS.ir
    let keyToUse = apiKey?.trim();
    let templateToUse = templateId?.toString().trim();
    let paramNameToUse = paramName?.trim() || 'Code';

    if (!keyToUse || !templateToUse) {
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
          provider: 'sms.ir',
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
