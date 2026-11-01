/**
 * Iranian Phone Number Normalizer & SMS Helper
 */

export function normalizePhoneNumber(rawPhone: string): string {
  if (!rawPhone) return '';

  // 1. Convert Persian and Arabic digits to English digits
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  let cleaned = rawPhone.trim();
  for (let i = 0; i < 10; i++) {
    cleaned = cleaned.replace(new RegExp(persianDigits[i], 'g'), i.toString());
    cleaned = cleaned.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
  }

  // 2. Remove all non-numeric characters (spaces, dashes, parens, plus)
  cleaned = cleaned.replace(/\D/g, '');

  // 3. Normalize international prefix
  if (cleaned.startsWith('0098')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('98') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(2);
  } else if (cleaned.startsWith('9') && cleaned.length === 10) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
}

export function isValidIranianMobile(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  // Valid Iranian mobile pattern: 11 digits starting with 09
  return /^09[0-9]{9}$/.test(normalized);
}

export interface SmsResult {
  success: boolean;
  messageId?: number;
  cost?: number;
  error?: string;
  devCode?: string;
  mode?: 'MOCK' | 'SANDBOX' | 'PRODUCTION';
}

/**
 * Sends Verification OTP via SMS.ir Fast-Send (ارسال اعتبارسنجی سریع)
 * Official Endpoint: POST https://api.sms.ir/v1/send/verify
 * Headers: x-api-key, Content-Type: application/json
 */
export async function sendSmsIrVerify(options: {
  mobile: string;
  code?: string;
  apiKey: string;
  templateId: string | number;
  paramName?: string;
  parameters?: Array<{ name: string; value: string }>;
}): Promise<SmsResult> {
  const normalized = normalizePhoneNumber(options.mobile);
  if (!isValidIranianMobile(normalized)) {
    return { success: false, error: 'شماره تلفن همراه نامعتبر است.' };
  }

  const templateIdNum = Number(options.templateId);
  if (isNaN(templateIdNum) || templateIdNum <= 0) {
    return { success: false, error: 'شناسه قالب (Template ID) نامعتبر است.' };
  }

  const paramName = (options.paramName || 'Code').trim();
  const parametersPayload = options.parameters || [
    {
      name: paramName,
      value: (options.code || '').toString().trim()
    }
  ];

  try {
    const res = await fetch('https://api.sms.ir/v1/send/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-api-key': options.apiKey.trim()
      },
      body: JSON.stringify({
        mobile: normalized,
        templateId: templateIdNum,
        parameters: parametersPayload
      })
    });

    const data = await res.json().catch(() => null);

    if (res.ok && data?.status === 1) {
      return {
        success: true,
        messageId: data.data?.messageId,
        cost: data.data?.cost
      };
    }

    let errorMsg = data?.message;
    if (res.status === 401) {
      errorMsg = 'کلید API پیامک (x-api-key) نامعتبر یا منقضی شده است.';
    } else if (res.status === 400 && !errorMsg) {
      errorMsg = 'شناسه قالب یا نام پارامتر در سامانه sms.ir همخوانی ندارد.';
    } else if (!errorMsg) {
      errorMsg = `خطای سامانه پیامک (${res.status})`;
    }

    console.error('[SMS.ir Error]', { status: res.status, data });
    return { success: false, error: errorMsg };
  } catch (err: any) {
    console.error('[SMS.ir Network Error]', err);
    return { success: false, error: err.message || 'خطا در برقراری ارتباط با سرور پیامک.' };
  }
}

/**
 * Sends Pattern SMS via FarazSMS / IranPayamak / IPPanel API
 * Documentation: https://docs.iranpayamak.com/
 * Official Endpoint: POST https://api.iranpayamak.com/ws/v1/sms/pattern
 * Headers: Api-Key: YOUR_API_KEY, Content-Type: application/json
 */
export async function sendFarazSmsPattern(options: {
  mobile: string;
  code?: string;
  apiKey: string;
  lineNumber: string;
  patternCode: string;
  paramName?: string;
  attributes?: Record<string, string>;
}): Promise<SmsResult> {
  const normalized = normalizePhoneNumber(options.mobile);
  if (!isValidIranianMobile(normalized)) {
    return { success: false, error: 'شماره تلفن همراه نامعتبر است.' };
  }

  const patternCode = (options.patternCode || '').trim();
  if (!patternCode) {
    return { success: false, error: 'کد الگوی فراز اس‌ام‌اس (Pattern Code) مشخص نشده است.' };
  }

  const lineNumber = (options.lineNumber || '').trim();
  if (!lineNumber) {
    return { success: false, error: 'شماره خط فرستنده فراز اس‌ام‌اس (line_number) مشخص نشده است.' };
  }

  const paramName = (options.paramName || 'code').trim();
  const attributesPayload = options.attributes || {
    [paramName]: (options.code || '').toString().trim()
  };

  try {
    const res = await fetch('https://api.iranpayamak.com/ws/v1/sms/pattern', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Api-Key': options.apiKey.trim()
      },
      body: JSON.stringify({
        code: patternCode,
        line_number: lineNumber,
        recipient: normalized,
        number_format: 'english',
        attributes: attributesPayload
      })
    });

    const data = await res.json().catch(() => null);

    if (res.ok && (data?.status === 'success' || data?.status === 200 || data?.data)) {
      const msgId = typeof data?.data === 'number' 
        ? data.data 
        : (data?.data?.id && typeof data.data.id === 'number' ? data.data.id : undefined);

      return {
        success: true,
        messageId: msgId,
        cost: 1
      };
    }

    let errorMsg = '';
    if (data?.message && typeof data.message === 'string') {
      errorMsg = data.message;
    } else if (data?.messages) {
      if (typeof data.messages === 'string') {
        errorMsg = data.messages;
      } else if (Array.isArray(data.messages)) {
        errorMsg = data.messages.join(' - ');
      } else if (typeof data.messages === 'object') {
        errorMsg = Object.values(data.messages).flat().join(' - ');
      }
    } else if (data?.errors) {
      errorMsg = Object.values(data.errors).flat().join(' - ');
    }

    if (res.status === 404) {
      errorMsg = errorMsg ? `${errorMsg} (کد الگوی «${patternCode}» در پنل فراز اس‌ام‌اس یافت نشد یا هنوز تایید نشده است)` : `کد الگوی «${patternCode}» در پنل فراز اس‌ام‌اس یافت نشد یا هنوز تایید نشده است.`;
    } else if (res.status === 401) {
      errorMsg = 'کلید Api-Key فراز اس‌ام‌اس نامعتبر یا منقضی شده است.';
    } else if (res.status === 403) {
      errorMsg = 'دسترسی کلید Api-Key در فراز اس‌ام‌اس مسدود است یا اعتبار حساب کافی نیست.';
    } else if (res.status === 422 && !errorMsg) {
      errorMsg = 'پارامترهای ارسالی با متغیرهای الگوی تعریف شده در فراز اس‌ام‌اس تطابق ندارد.';
    } else if (!errorMsg) {
      errorMsg = `خطای سامانه فراز اس‌ام‌اس (${res.status})`;
    }

    console.error('[FarazSMS Error]', { status: res.status, data, errorMsg });
    return { success: false, error: errorMsg };
  } catch (err: any) {
    console.error('[FarazSMS Network Error]', err);
    return { success: false, error: err.message || 'خطا در ارتباط با سرور فراز اس‌ام‌اس.' };
  }
}

/**
 * Checks account balance via FarazSMS / IranPayamak API
 * Endpoint: GET https://api.iranpayamak.com/ws/v1/account/balance
 */
export async function checkFarazSmsBalance(apiKey: string): Promise<{
  success: boolean;
  balance?: number;
  balanceCount?: number;
  error?: string;
}> {
  try {
    const res = await fetch('https://api.iranpayamak.com/ws/v1/account/balance', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Api-Key': apiKey.trim()
      }
    });

    const data = await res.json().catch(() => null);
    if (res.ok && (data?.status === 'success' || data?.status === 200) && data?.data !== undefined) {
      let balanceAmount = 0;
      let balanceCount: number | undefined = undefined;

      if (typeof data.data === 'number') {
        balanceAmount = data.data;
      } else if (typeof data.data === 'string') {
        balanceAmount = parseFloat(data.data) || 0;
      } else if (typeof data.data === 'object' && data.data !== null) {
        // FarazSMS / IranPayamak / IPPanel format:
        // { balance_amount: "50504", balance_count: "203.6451612903225806" }
        const rawAmount = data.data.balance_amount ?? data.data.balance ?? data.data.credit ?? data.data.amount;
        balanceAmount = Number(rawAmount) || 0;

        const rawCount = data.data.balance_count ?? data.data.count;
        if (rawCount !== undefined && rawCount !== null) {
          balanceCount = Math.floor(Number(rawCount)) || undefined;
        }
      }

      return {
        success: true,
        balance: balanceAmount,
        balanceCount
      };
    }

    let errorMsg = data?.message || data?.messages;
    if (!errorMsg && res.status === 401) {
      errorMsg = 'کلید Api-Key فراز اس‌ام‌اس نامعتبر است.';
    } else if (!errorMsg) {
      errorMsg = `خطا در دریافت موجودی (${res.status})`;
    } else if (typeof errorMsg === 'object') {
      errorMsg = JSON.stringify(errorMsg);
    }

    return { success: false, error: errorMsg };
  } catch (err: any) {
    return { success: false, error: err.message || 'خطای شبکه در بررسی موجودی فراز اس‌ام‌اس' };
  }
}

/**
 * Live test function for Admin Settings to verify FarazSMS credentials
 */
export async function testFarazSmsConnection(options: {
  mobile: string;
  apiKey: string;
  lineNumber: string;
  patternCode: string;
  paramName?: string;
  code?: string;
  testCode?: string;
}): Promise<SmsResult & { balance?: number }> {
  const code = options.testCode || options.code || Math.floor(10000 + Math.random() * 90000).toString();
  const sendRes = await sendFarazSmsPattern({
    mobile: options.mobile,
    code,
    apiKey: options.apiKey,
    lineNumber: options.lineNumber,
    patternCode: options.patternCode,
    paramName: options.paramName
  });

  let balance: number | undefined;
  if (options.apiKey) {
    const balRes = await checkFarazSmsBalance(options.apiKey);
    if (balRes.success) balance = balRes.balance;
  }

  return {
    ...sendRes,
    balance
  };
}

/**
 * Live test function for Admin Settings to verify SMS.ir credentials
 */
export async function testSmsIrConnection(options: {
  mobile: string;
  apiKey: string;
  templateId: string | number;
  paramName?: string;
  code?: string;
  testCode?: string;
}): Promise<SmsResult> {
  const code = options.testCode || options.code || Math.floor(10000 + Math.random() * 90000).toString();
  return sendSmsIrVerify({
    mobile: options.mobile,
    code,
    apiKey: options.apiKey,
    templateId: options.templateId,
    paramName: options.paramName
  });
}

/**
 * Sends OTP via active SMS provider (SMS.ir or FarazSMS)
 * Automatically loads SiteSettings from DB or process.env
 */
export async function sendSmsOtp(phone: string, code: string): Promise<SmsResult> {
  const normalized = normalizePhoneNumber(phone);

  let smsProvider = 'sms.ir';
  let isMobileOtpActive = true;
  let smsIsSandbox = false;

  // SMS.ir config
  let apiKey: string | null = null;
  let templateId: string | null = null;
  let paramName: string = 'Code';

  // FarazSMS config
  let farazApiKey: string | null = null;
  let farazLineNumber: string | null = null;
  let farazPatternCode: string | null = null;
  let farazOtpParamName: string = 'code';

  try {
    const { default: prisma } = await import('@/lib/prisma');
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
    if (settings) {
      isMobileOtpActive = settings.isMobileOtpActive;
      smsProvider = settings.smsProvider || 'sms.ir';
      smsIsSandbox = Boolean(settings.smsIsSandbox);
      
      // FarazSMS fields
      farazApiKey = settings.farazSmsApiKey || process.env.FARAZSMS_API_KEY || null;
      farazLineNumber = settings.farazSmsLineNumber || process.env.FARAZSMS_LINE_NUMBER || null;
      farazPatternCode = settings.farazSmsPatternCode || process.env.FARAZSMS_PATTERN_CODE || null;
      farazOtpParamName = settings.farazSmsOtpParamName || 'code';

      // SMS.ir fields
      if (smsIsSandbox) {
        apiKey = settings.smsSandboxApiKey || settings.smsApiKey || process.env.SMSIR_SANDBOX_API_KEY || process.env.SMSIR_API_KEY || null;
      } else {
        apiKey = settings.smsApiKey || process.env.SMSIR_API_KEY || null;
      }

      templateId = settings.smsTemplateId || process.env.SMSIR_TEMPLATE_ID || null;
      paramName = settings.smsOtpParamName || 'Code';
    }
  } catch (err) {
    console.warn('[SMS] Could not load SiteSettings for SMS config, checking env...', err);
  }

  if (!isMobileOtpActive) {
    return {
      success: false,
      error: 'ارسال رمز یکبار مصرف پیامکی موقتاً توسط مدیریت غیرفعال شده است.'
    };
  }

  // --- FARAZSMS PROVIDER ---
  if (smsProvider === 'farazsms') {
    if (!farazApiKey) farazApiKey = process.env.FARAZSMS_API_KEY || null;
    if (!farazLineNumber) farazLineNumber = process.env.FARAZSMS_LINE_NUMBER || null;
    if (!farazPatternCode) farazPatternCode = process.env.FARAZSMS_PATTERN_CODE || null;

    if (farazApiKey && farazLineNumber && farazPatternCode) {
      const result = await sendFarazSmsPattern({
        mobile: normalized,
        code,
        apiKey: farazApiKey,
        lineNumber: farazLineNumber,
        patternCode: farazPatternCode,
        paramName: farazOtpParamName
      });

      if (!result.success) {
        return result;
      }

      return {
        ...result,
        mode: 'PRODUCTION'
      };
    }

    // Mock fallback if Faraz credentials are not yet configured
    console.log('====================================================');
    console.log(`[FARAZ-SMS MOCK] Verification Code to ${normalized}: ${code}`);
    console.log('====================================================');
    return {
      success: true,
      mode: 'MOCK',
      devCode: code
    };
  }

  // --- SMS.IR PROVIDER ---
  if (!apiKey) {
    apiKey = smsIsSandbox 
      ? (process.env.SMSIR_SANDBOX_API_KEY || process.env.SMSIR_API_KEY || null)
      : (process.env.SMSIR_API_KEY || null);
  }
  if (!templateId) templateId = process.env.SMSIR_TEMPLATE_ID || null;

  if (apiKey && templateId) {
    const result = await sendSmsIrVerify({
      mobile: normalized,
      code,
      apiKey,
      templateId,
      paramName
    });

    if (!result.success) {
      return result;
    }

    // Determine if the key or response indicates Sandbox
    const isSandboxKey =
      smsIsSandbox ||
      apiKey.toLowerCase().includes('sandbox') ||
      apiKey.toLowerCase().includes('test') ||
      result.cost === 0;

    if (isSandboxKey) {
      return {
        ...result,
        mode: 'SANDBOX',
        devCode: code
      };
    }

    return {
      ...result,
      mode: 'PRODUCTION'
    };
  }

  // Fallback when API Key or Template ID is empty (MOCK mode)
  return {
    success: true,
    mode: 'MOCK',
    devCode: code
  };
}

export async function sendSmsNotification(phone: string, text: string): Promise<{ success: boolean; message?: string }> {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return { success: false, message: 'Invalid phone' };

  try {
    const { default: prisma } = await import('@/lib/prisma');
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
    const apiKey = settings?.smsApiKey || process.env.SMSIR_API_KEY;
    const lineNumber = settings?.smsLineNumber || process.env.SMSIR_LINE_NUMBER;

    if (apiKey && lineNumber) {
      const res = await fetch('https://api.sms.ir/v1/send/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim()
        },
        body: JSON.stringify({
          lineNumber: lineNumber.trim(),
          messageText: text,
          mobiles: [normalized]
        })
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.status === 1) {
        return { success: true };
      }
      console.error('[SMS.ir Bulk Notification Error]', data);
    }
  } catch (err) {
    console.error('[SMS] Error calling SMS.ir bulk provider:', err);
  }

  // Fallback log
  console.log('====================================================');
  console.log(`[SMS-DEV] Notification to ${normalized}:\n${text}`);
  console.log('====================================================');

  return { success: true };
}

/**
 * Iranian National ID (کد ملی) Validation Algorithm
 * 1. Converts Persian/Arabic digits to English digits
 * 2. Checks length === 10 digits
 * 3. Rejects repetitive digits (0000000000, 1111111111, ..., 9999999999)
 * 4. Verifies standard checksum modulo 11
 */
export function isValidIranianNationalId(rawId: string | null | undefined): boolean {
  if (!rawId) return false;

  // 1. Convert Persian/Arabic digits to English
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  let code = rawId.trim();
  for (let i = 0; i < 10; i++) {
    code = code.replace(new RegExp(persianDigits[i], 'g'), i.toString());
    code = code.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
  }

  // Remove non-numeric characters
  code = code.replace(/\D/g, '');

  // Must be exactly 10 digits
  if (!/^\d{10}$/.test(code)) return false;

  // Reject all repetitive patterns (0000000000, 1111111111, ..., 9999999999)
  if (/^(\d)\1{9}$/.test(code)) return false;

  // Standard checksum modulo 11
  const checkDigit = parseInt(code.charAt(9), 10);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(code.charAt(i), 10) * (10 - i);
  }

  const remainder = sum % 11;
  if (remainder < 2) {
    return checkDigit === remainder;
  } else {
    return checkDigit === 11 - remainder;
  }
}

/**
 * Iranian Sheba (IBAN) Validation Algorithm (ISO 13616 / MOD-97-10)
 * 1. Converts Persian/Arabic digits to English digits
 * 2. Removes 'IR', spaces and non-numeric characters
 * 3. Verifies length === 24 digits
 * 4. Rearranges: [22 digits] + "1827" + [first 2 digits]
 * 5. Computes BigInt(rearranged) % 97n === 1n
 */
export function isValidIranianSheba(rawSheba: string | null | undefined): boolean {
  if (!rawSheba) return false;

  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  let cleaned = rawSheba.trim().toUpperCase();
  for (let i = 0; i < 10; i++) {
    cleaned = cleaned.replace(new RegExp(persianDigits[i], 'g'), i.toString());
    cleaned = cleaned.replace(new RegExp(arabicDigits[i], 'g'), i.toString());
  }

  // Remove IR prefix and non-numeric characters
  cleaned = cleaned.replace(/^IR/i, '').replace(/\D/g, '');

  // Must be exactly 24 digits
  if (cleaned.length !== 24) return false;

  // Rearrange: body (last 22 digits) + '1827' (IR) + check digits (first 2 digits)
  const checkDigits = cleaned.substring(0, 2);
  const accountBody = cleaned.substring(2);
  const rearranged = accountBody + '1827' + checkDigits;

  try {
    let remainder = 0;
    for (let i = 0; i < rearranged.length; i += 7) {
      const chunk = String(remainder) + rearranged.substring(i, i + 7);
      remainder = parseInt(chunk, 10) % 97;
    }
    return remainder === 1;
  } catch {
    return false;
  }
}

/**
 * Helper to distinguish Level 2 Profile edits from Level 3 KYC submissions
 */
export function hasProfilePendingEdits(pendingEdits: any): boolean {
  if (!pendingEdits) return false;
  try {
    const pe = typeof pendingEdits === 'string' ? JSON.parse(pendingEdits) : pendingEdits;
    if (pe?.type === 'LEVEL_3_KYC') return false;
    return Boolean(pe && typeof pe === 'object' && Object.keys(pe).length > 0);
  } catch {
    return false;
  }
}

/**
 * Sends Referral Code invitation via active SMS provider (SMS.ir or FarazSMS)
 * Sends referralCode as the parameter value.
 */
export async function sendReferralInviteSms(options: {
  mobile: string;
  referralCode: string;
  registerUrl: string;
  recipientName?: string;
}): Promise<SmsResult> {
  const normalized = normalizePhoneNumber(options.mobile);
  if (!isValidIranianMobile(normalized)) {
    return { success: false, error: 'شماره تلفن همراه نامعتبر است.' };
  }

  let isMobileOtpActive = true;
  let smsProvider = 'sms.ir';
  let smsIsSandbox = false;

  // SMS.ir
  let apiKey: string | null = null;
  let templateId: string | null = null;
  let paramName = 'Code';
  let smsReferralWithNameTemplateId: string | null = null;
  let smsReferralNameParamName = 'name';

  // FarazSMS
  let farazApiKey: string | null = null;
  let farazLineNumber: string | null = null;
  let farazPatternCode: string | null = null;
  let farazOtpParamName = 'code';
  let farazReferralPatternCode: string | null = null;
  let farazReferralParamName = 'code';
  let farazReferralWithNamePatternCode: string | null = null;
  let farazReferralNameParamName = 'name';

  try {
    const { default: prisma } = await import('@/lib/prisma');
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
    if (settings) {
      isMobileOtpActive = settings.isMobileOtpActive;
      smsProvider = settings.smsProvider || 'sms.ir';
      smsIsSandbox = Boolean(settings.smsIsSandbox);
      
      // FarazSMS
      farazApiKey = settings.farazSmsApiKey || process.env.FARAZSMS_API_KEY || null;
      farazLineNumber = settings.farazSmsLineNumber || process.env.FARAZSMS_LINE_NUMBER || null;
      farazPatternCode = settings.farazSmsPatternCode || process.env.FARAZSMS_PATTERN_CODE || null;
      farazOtpParamName = settings.farazSmsOtpParamName || 'code';
      farazReferralPatternCode = settings.farazSmsReferralPatternCode || settings.farazSmsPatternCode || process.env.FARAZSMS_REFERRAL_PATTERN_CODE || process.env.FARAZSMS_PATTERN_CODE || null;
      farazReferralParamName = settings.farazSmsReferralParamName || settings.farazSmsOtpParamName || 'code';
      farazReferralWithNamePatternCode = settings.farazSmsReferralWithNamePatternCode || null;
      farazReferralNameParamName = settings.farazSmsReferralNameParamName || 'name';

      // SMS.ir
      if (smsIsSandbox) {
        apiKey = settings.smsSandboxApiKey || settings.smsApiKey || process.env.SMSIR_SANDBOX_API_KEY || process.env.SMSIR_API_KEY || null;
      } else {
        apiKey = settings.smsApiKey || process.env.SMSIR_API_KEY || null;
      }

      templateId = settings.smsReferralTemplateId || settings.smsTemplateId || process.env.SMSIR_REFERRAL_TEMPLATE_ID || process.env.SMSIR_TEMPLATE_ID || null;
      paramName = settings.smsReferralParamName || 'Code';
      smsReferralWithNameTemplateId = settings.smsReferralWithNameTemplateId || null;
      smsReferralNameParamName = settings.smsReferralNameParamName || 'name';
    }
  } catch (err) {
    console.warn('[SMS Referral] Could not load SiteSettings, checking env...', err);
  }

  if (!isMobileOtpActive) {
    return {
      success: false,
      error: 'سرویس ارسال پیامک موقتاً توسط مدیریت غیرفعال شده است.'
    };
  }

  const cleanRecipientName = options.recipientName?.trim();

  // --- FARAZSMS PROVIDER ---
  if (smsProvider === 'farazsms') {
    if (!farazApiKey) farazApiKey = process.env.FARAZSMS_API_KEY || null;
    if (!farazLineNumber) farazLineNumber = process.env.FARAZSMS_LINE_NUMBER || null;
    if (!farazReferralPatternCode) farazReferralPatternCode = process.env.FARAZSMS_REFERRAL_PATTERN_CODE || process.env.FARAZSMS_PATTERN_CODE || null;

    if (farazApiKey && farazLineNumber) {
      let result: SmsResult | null = null;

      // 1. Try pattern with name if artistName was entered and pattern is configured
      if (cleanRecipientName && farazReferralWithNamePatternCode) {
        result = await sendFarazSmsPattern({
          mobile: normalized,
          apiKey: farazApiKey,
          lineNumber: farazLineNumber,
          patternCode: farazReferralWithNamePatternCode,
          attributes: {
            [farazReferralNameParamName || 'name']: cleanRecipientName,
            [farazReferralParamName || 'code']: options.referralCode
          }
        });

        if (!result.success) {
          console.warn(`[FarazSMS] Referral with name pattern '${farazReferralWithNamePatternCode}' failed (${result.error}). Retrying with default referral pattern...`);
        }
      }

      // 2. Standard referral pattern (without name or fallback)
      if ((!result || !result.success) && farazReferralPatternCode) {
        result = await sendFarazSmsPattern({
          mobile: normalized,
          code: options.referralCode,
          apiKey: farazApiKey,
          lineNumber: farazLineNumber,
          patternCode: farazReferralPatternCode,
          paramName: farazReferralParamName
        });
      }

      // 3. Smart Fallback: If dedicated referral pattern failed (e.g. 404 unapproved/not found), retry with primary verified OTP pattern
      if ((!result || !result.success) && farazPatternCode && farazReferralPatternCode !== farazPatternCode) {
        console.warn(`[FarazSMS] Referral pattern '${farazReferralPatternCode}' failed (${result?.error}). Retrying with primary OTP pattern '${farazPatternCode}'...`);
        const fallbackRes = await sendFarazSmsPattern({
          mobile: normalized,
          code: options.referralCode,
          apiKey: farazApiKey,
          lineNumber: farazLineNumber,
          patternCode: farazPatternCode,
          paramName: farazOtpParamName || 'code'
        });
        if (fallbackRes.success) {
          result = fallbackRes;
        }
      }

      if (!result?.success) {
        return result || { success: false, error: 'خطا در ارسال پیامک با فراز اس‌ام‌اس' };
      }

      return {
        ...result,
        mode: 'PRODUCTION'
      };
    }

    // Mock fallback
    console.log('====================================================');
    console.log(`[FARAZ-SMS REFERRAL MOCK] Invitation to ${normalized}${cleanRecipientName ? ` (${cleanRecipientName})` : ''}`);
    console.log(`Code: ${options.referralCode} | Link: ${options.registerUrl}`);
    console.log('====================================================');
    return {
      success: true,
      mode: 'MOCK',
      devCode: options.referralCode
    };
  }

  // --- SMS.IR PROVIDER ---
  if (!apiKey) {
    apiKey = smsIsSandbox 
      ? (process.env.SMSIR_SANDBOX_API_KEY || process.env.SMSIR_API_KEY || null)
      : (process.env.SMSIR_API_KEY || null);
  }
  if (!templateId) {
    templateId = process.env.SMSIR_REFERRAL_TEMPLATE_ID || process.env.SMSIR_TEMPLATE_ID || null;
  }

  // 1. Live credentials provided (calls real sms.ir endpoint with referralCode as parameter value; max length is 25 chars)
  if (apiKey && (templateId || (cleanRecipientName && smsReferralWithNameTemplateId))) {
    let result: SmsResult | null = null;

    if (cleanRecipientName && smsReferralWithNameTemplateId) {
      result = await sendSmsIrVerify({
        mobile: normalized,
        apiKey,
        templateId: smsReferralWithNameTemplateId,
        parameters: [
          { name: smsReferralNameParamName || 'name', value: cleanRecipientName },
          { name: paramName || 'Code', value: options.referralCode }
        ]
      });
    }

    if ((!result || !result.success) && templateId) {
      result = await sendSmsIrVerify({
        mobile: normalized,
        code: options.referralCode,
        apiKey,
        templateId,
        paramName
      });
    }

    if (!result?.success) {
      return result || { success: false, error: 'خطا در ارسال پیامک با sms.ir' };
    }

    const isSandboxKey =
      smsIsSandbox ||
      apiKey.toLowerCase().includes('sandbox') ||
      apiKey.toLowerCase().includes('test') ||
      result.cost === 0;

    if (isSandboxKey) {
      return {
        ...result,
        mode: 'SANDBOX',
        devCode: options.referralCode
      };
    }

    return {
      ...result,
      mode: 'PRODUCTION'
    };
  }

  // 2. Mock mode for dev/local
  console.log('====================================================');
  console.log(`[SMS-REFERRAL MOCK] Invitation to ${normalized}${cleanRecipientName ? ` (${cleanRecipientName})` : ''}`);
  console.log(`Code: ${options.referralCode} | Link: ${options.registerUrl}`);
  console.log('====================================================');

  return {
    success: true,
    mode: 'MOCK',
    devCode: options.referralCode
  };
}
