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
  code: string;
  apiKey: string;
  templateId: string | number;
  paramName?: string;
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
        parameters: [
          {
            name: paramName,
            value: options.code.toString().trim()
          }
        ]
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
 * Sends OTP via SMS.ir (automatically loads SiteSettings from DB or process.env)
 */
export async function sendSmsOtp(phone: string, code: string): Promise<SmsResult> {
  const normalized = normalizePhoneNumber(phone);

  let apiKey: string | null = null;
  let templateId: string | null = null;
  let paramName: string = 'Code';
  let isMobileOtpActive = true;
  let smsIsSandbox = false;

  try {
    const { default: prisma } = await import('@/lib/prisma');
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
    if (settings) {
      isMobileOtpActive = settings.isMobileOtpActive;
      smsIsSandbox = Boolean(settings.smsIsSandbox);
      apiKey = settings.smsApiKey || process.env.SMSIR_API_KEY || null;
      templateId = settings.smsTemplateId || process.env.SMSIR_TEMPLATE_ID || null;
      paramName = settings.smsOtpParamName || 'Code';
    }
  } catch (err) {
    console.warn('[SMS] Could not load SiteSettings for SMS config, checking env...', err);
  }

  if (!apiKey) apiKey = process.env.SMSIR_API_KEY || null;
  if (!templateId) templateId = process.env.SMSIR_TEMPLATE_ID || null;

  if (!isMobileOtpActive) {
    return {
      success: false,
      error: 'ارسال رمز یکبار مصرف پیامکی موقتاً توسط مدیریت غیرفعال شده است.'
    };
  }

  // 1. Live credentials provided (calls real sms.ir endpoint)
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

  // 2. Fallback when API Key or Template ID is empty (MOCK mode)
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
