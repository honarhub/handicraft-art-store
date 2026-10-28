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

export async function sendSmsOtp(phone: string, code: string): Promise<{ success: boolean; message?: string }> {
  const normalized = normalizePhoneNumber(phone);
  
  // If third-party SMS API key is configured (e.g., Kavenegar / Ghasedak / FarazSMS)
  const kavenegarKey = process.env.KAVENEGAR_API_KEY;

  if (kavenegarKey) {
    try {
      const template = process.env.KAVENEGAR_OTP_TEMPLATE || 'honarhub-otp';
      const url = `https://api.kavenegar.com/v1/${kavenegarKey}/verify/lookup.json?receptor=${normalized}&token=${code}&template=${template}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.return?.status === 200) {
        return { success: true };
      }
      console.error('[SMS] Kavenegar error:', data);
    } catch (err) {
      console.error('[SMS] Error calling SMS provider:', err);
    }
  }

  // Fallback in development or when SMS provider is not yet set up
  console.log('====================================================');
  console.log(`[SMS-DEV] Verification OTP for ${normalized}: [ ${code} ]`);
  console.log('====================================================');

  return { success: true };
}

export async function sendSmsNotification(phone: string, text: string): Promise<{ success: boolean; message?: string }> {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) return { success: false, message: 'Invalid phone' };

  const kavenegarKey = process.env.KAVENEGAR_API_KEY;

  if (kavenegarKey) {
    try {
      const sender = process.env.KAVENEGAR_SENDER || '10008663';
      const url = `https://api.kavenegar.com/v1/${kavenegarKey}/sms/send.json?receptor=${normalized}&sender=${sender}&message=${encodeURIComponent(text)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.return?.status === 200) {
        return { success: true };
      }
      console.error('[SMS] Kavenegar notification error:', data);
    } catch (err) {
      console.error('[SMS] Error calling SMS provider:', err);
    }
  }

  // Fallback log
  console.log('====================================================');
  console.log(`[SMS-DEV] Notification to ${normalized}:\n${text}`);
  console.log('====================================================');

  return { success: true };
}
