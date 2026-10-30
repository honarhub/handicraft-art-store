import { Resend } from 'resend';

export interface EmailSendResult {
  success: boolean;
  id?: string;
  error?: string;
  devCode?: string;
  mode?: 'SANDBOX' | 'PRODUCTION';
}

/**
 * Loads Resend credentials from SiteSettings in DB or process.env
 */
export async function getEmailConfig() {
  let resendApiKey: string | null = null;
  let emailFromAddress = 'no-reply@honarhub.ir';
  let emailFromName = 'هنرهاب';
  let isEmailServiceActive = true;
  let emailIsSandbox = false;

  try {
    const { default: prisma } = await import('@/lib/prisma');
    const settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
    if (settings) {
      isEmailServiceActive = settings.isEmailServiceActive;
      emailIsSandbox = Boolean(settings.emailIsSandbox);
      resendApiKey = settings.resendApiKey || process.env.RESEND_API_KEY || null;
      emailFromAddress = settings.emailFromAddress || process.env.RESEND_FROM_EMAIL || 'no-reply@honarhub.ir';
      emailFromName = settings.emailFromName || process.env.RESEND_FROM_NAME || 'هنرهاب';
    }
  } catch (err) {
    console.warn('[Email] Could not load SiteSettings for Email config, checking env...', err);
  }

  if (!resendApiKey) resendApiKey = process.env.RESEND_API_KEY || null;
  if (!emailFromAddress) emailFromAddress = process.env.RESEND_FROM_EMAIL || 'no-reply@honarhub.ir';

  return {
    isEmailServiceActive,
    emailIsSandbox,
    resendApiKey,
    emailFromAddress,
    emailFromName
  };
}

/**
 * Modern, responsive Persian HTML template for OTP verification emails
 */
export function renderOtpEmailHtml(code: string): string {
  return `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>کد تایید هنرهاب</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; direction: rtl; text-align: right;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header Branding -->
          <tr>
            <td style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); padding: 32px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                هنر<span style="background-color: #FF9900; color: #000000; padding: 2px 8px; border-radius: 6px; margin-right: 4px; font-size: 24px;">هاب</span>
              </h1>
              <p style="margin: 8px 0 0 0; color: #a7f3d0; font-size: 13px;">پلتفرم تخصصی دست‌سازه‌ها و آثار هنری اصیل ایرانی</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 800; color: #1e293b; text-align: center;">
                کد تایید یکبار مصرف
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.8; color: #475569; text-align: center;">
                برای احراز هویت و ورود به حساب کاربری در هنرهاب، لطفاً کد ۵ رقمی زیر را در سایت وارد نمایید:
              </p>

              <!-- OTP Code Display Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #ecfdf5; border: 2px dashed #10b981; border-radius: 16px; padding: 18px 30px; display: inline-block;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 900; color: #065f46; letter-spacing: 10px; display: inline-block; direction: ltr;">
                        ${code}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Notice & Expiry -->
              <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px 18px; margin-top: 24px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.7; color: #92400e;">
                  ⏳ <strong>اعتبار زمانی:</strong> این کد به مدت <strong>۲ دقیقه</strong> معتبر است.<br>
                  🔒 <strong>امنیت حساب:</strong> این کد کاملاً محرمانه است؛ تیم پشتیبانی هنرهاب هرگز آن را از شما درخواست نخواهد کرد.
                </p>
              </div>

              <p style="margin: 28px 0 0 0; font-size: 12px; line-height: 1.6; color: #94a3b8; text-align: center;">
                اگر شما درخواست این کد را نداده‌اید، نیازی به انجام کاری نیست و این ایمیل را نادیده بگیرید.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; direction: ltr;">
                © HonarHub. All rights reserved. • <a href="https://honarhub.ir" style="color: #059669; text-decoration: none;">honarhub.ir</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Modern, responsive Persian HTML template for Password Reset emails
 */
export function renderPasswordResetEmailHtml(code: string): string {
  return `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>بازیابی رمز عبور هنرهاب</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; direction: rtl; text-align: right;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Header Branding -->
          <tr>
            <td style="background: linear-gradient(135deg, #064e3b 0%, #047857 100%); padding: 32px 30px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px;">
                هنر<span style="background-color: #FF9900; color: #000000; padding: 2px 8px; border-radius: 6px; margin-right: 4px; font-size: 24px;">هاب</span>
              </h1>
              <p style="margin: 8px 0 0 0; color: #a7f3d0; font-size: 13px;">بازیابی رمز عبور حساب کاربری</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 800; color: #1e293b; text-align: center;">
                درخواست بازنشانی رمز عبور
              </h2>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.8; color: #475569; text-align: center;">
                یک درخواست برای بازنشانی رمز عبور حساب کاربری شما در هنرهاب ثبت شده است. جهت تکمیل فرآیند و تعریف رمز جدید، کد ۵ رقمی زیر را وارد نمایید:
              </p>

              <!-- Code Display Box -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #eff6ff; border: 2px dashed #3b82f6; border-radius: 16px; padding: 18px 30px; display: inline-block;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 34px; font-weight: 900; color: #1e40af; letter-spacing: 10px; display: inline-block; direction: ltr;">
                        ${code}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 14px 18px; margin-top: 24px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.7; color: #991b1b;">
                  ⚠️ <strong>هشدار امنیتی:</strong> چنانچه شما این درخواست را نداده‌اید، نیازی به نگرانی نیست؛ رمز عبور فعلی شما همچنان فعال است و تا زمانی که این کد وارد نشود، تغییری ایجاد نخواهد شد.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 30px; border-top: 1px solid #f1f5f9; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #94a3b8; direction: ltr;">
                © HonarHub. All rights reserved. • <a href="https://honarhub.ir" style="color: #059669; text-decoration: none;">honarhub.ir</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Sends OTP code via Resend Email Service or Internal Sandbox Mock
 */
export async function sendEmailOtp(toEmail: string, code: string): Promise<EmailSendResult> {
  const emailTrimmed = toEmail.trim().toLowerCase();
  const config = await getEmailConfig();

  if (!config.isEmailServiceActive) {
    return {
      success: false,
      error: 'سرویس ارسال ایمیل موقتاً توسط مدیریت غیرفعال شده است.'
    };
  }

  // 1. Sandbox / Mock Mode: Does NOT need an API key!
  if (config.emailIsSandbox) {
    console.log('====================================================');
    console.log(`[EMAIL-SANDBOX-MOCK] Simulation OTP for ${emailTrimmed}: [ ${code} ]`);
    console.log('====================================================');
    return {
      success: true,
      mode: 'SANDBOX',
      devCode: code
    };
  }

  // 2. Production Mode: Requires Resend API Key
  if (config.resendApiKey) {
    try {
      const resend = new Resend(config.resendApiKey.trim());
      const fromField = `${config.emailFromName} <${config.emailFromAddress.trim()}>`;

      const { data, error } = await resend.emails.send({
        from: fromField,
        to: emailTrimmed,
        subject: `کد تایید ورود به هنرهاب: ${code}`,
        html: renderOtpEmailHtml(code),
        headers: {
          'X-Entity-Ref-ID': `otp-${Date.now()}`
        }
      });

      if (error) {
        console.error('[Resend Error]', error);
        return {
          success: false,
          error: error.message || 'خطا در ارسال ایمیل از طریق Resend'
        };
      }

      console.log(`[Resend Success] Email sent to ${emailTrimmed} (ID: ${data?.id})`);
      return {
        success: true,
        id: data?.id,
        mode: 'PRODUCTION'
      };
    } catch (err: any) {
      console.error('[Resend Network Error]', err);
      return {
        success: false,
        error: err.message || 'خطای شبکه در اتصال به سرویس Resend'
      };
    }
  }

  // Fallback in development or when Resend key is not yet configured
  console.log('====================================================');
  console.log(`[EMAIL-DEV MOCK] Verification OTP for ${emailTrimmed}: [ ${code} ]`);
  console.log('====================================================');

  return {
    success: true,
    mode: 'SANDBOX',
    devCode: code
  };
}

/**
 * Sends Password Reset OTP code via Resend Email Service or Internal Sandbox Mock
 */
export async function sendPasswordResetEmail(toEmail: string, code: string): Promise<EmailSendResult> {
  const emailTrimmed = toEmail.trim().toLowerCase();
  const config = await getEmailConfig();

  if (!config.isEmailServiceActive) {
    return {
      success: false,
      error: 'سرویس ارسال ایمیل موقتاً توسط مدیریت غیرفعال شده است.'
    };
  }

  // 1. Sandbox / Mock Mode
  if (config.emailIsSandbox) {
    console.log('====================================================');
    console.log(`[EMAIL-RESET-SANDBOX-MOCK] Reset Code for ${emailTrimmed}: [ ${code} ]`);
    console.log('====================================================');
    return {
      success: true,
      mode: 'SANDBOX',
      devCode: code
    };
  }

  // 2. Production Mode
  if (config.resendApiKey) {
    try {
      const resend = new Resend(config.resendApiKey.trim());
      const fromField = `${config.emailFromName} <${config.emailFromAddress.trim()}>`;

      const { data, error } = await resend.emails.send({
        from: fromField,
        to: emailTrimmed,
        subject: `بازیابی رمز عبور هنرهاب - کد تایید: ${code}`,
        html: renderPasswordResetEmailHtml(code)
      });

      if (error) {
        console.error('[Resend Reset Error]', error);
        return {
          success: false,
          error: error.message || 'خطا در ارسال ایمیل بازیابی رمز'
        };
      }

      return {
        success: true,
        id: data?.id,
        mode: 'PRODUCTION'
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'خطا در ارسال ایمیل بازیابی'
      };
    }
  }

  // Fallback
  console.log('====================================================');
  console.log(`[EMAIL-RESET-DEV MOCK] Reset Code for ${emailTrimmed}: [ ${code} ]`);
  console.log('====================================================');

  return {
    success: true,
    mode: 'SANDBOX',
    devCode: code
  };
}

/**
 * Live test tool for Admin Settings to verify Resend credentials or simulate Sandbox send
 */
export async function testEmailService(options: {
  isSandbox?: boolean;
  apiKey?: string | null;
  fromEmail: string;
  fromName: string;
  toEmail: string;
}): Promise<EmailSendResult> {
  const testCode = Math.floor(10000 + Math.random() * 90000).toString();

  // If Sandbox mode is chosen: no API key required!
  if (options.isSandbox) {
    console.log('====================================================');
    console.log(`[EMAIL-TEST-SANDBOX-MOCK] Simulated test email for ${options.toEmail}: [ ${testCode} ]`);
    console.log('====================================================');
    return {
      success: true,
      mode: 'SANDBOX',
      devCode: testCode,
      id: `mock-sandbox-${Date.now()}`
    };
  }

  if (!options.apiKey) {
    return {
      success: false,
      error: 'کلید Resend API Key وارد نشده است. لطفاً برای حالت عملیاتی، کلید اختصاصی خود را وارد نمایید.'
    };
  }

  const resend = new Resend(options.apiKey.trim());
  const fromField = `${options.fromName.trim()} <${options.fromEmail.trim()}>`;

  try {
    const { data, error } = await resend.emails.send({
      from: fromField,
      to: options.toEmail.trim().toLowerCase(),
      subject: `ایمیل تستی هنرهاب (کد آزمایشی: ${testCode})`,
      html: `
        <div style="font-family: sans-serif; direction: rtl; text-align: right; padding: 20px;">
          <h2 style="color: #047857;">اتصال موفق سرویس ایمیل هنرهاب (Resend) 🎉</h2>
          <p>این یک ایمیل تستی است که از طریق پنل مدیریت سایت هنرهاب ارسال شده است.</p>
          <p><strong>فرستنده:</strong> ${fromField}</p>
          <p><strong>گیرنده:</strong> ${options.toEmail}</p>
          <p><strong>کد آزمایشی:</strong> ${testCode}</p>
        </div>
      `
    });

    if (error) {
      return {
        success: false,
        error: error.message || 'خطای سرویس Resend'
      };
    }

    return {
      success: true,
      id: data?.id,
      mode: 'PRODUCTION'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'خطای ارتباط با سرور Resend'
    };
  }
}

// Alias for backwards compatibility
export const testResendConnection = testEmailService;
