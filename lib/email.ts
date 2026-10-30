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
 * Modern, formal, lightweight Persian HTML template for OTP verification emails
 * Features Vazirmatn font, HonarHub branding, huge OTP display, and support channels.
 */
export function renderOtpEmailHtml(code: string): string {
  return `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>کد تایید هنرهاب</title>
  <!-- Vazirmatn Font for supporting email clients -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700;800;900&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700;800;900&display=swap');
    body, table, td, p, a, span, h1, h2, h3 {
      font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Tahoma, Arial, sans-serif !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Tahoma, Arial, sans-serif; direction: rtl; text-align: right; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 36px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Lightweight Header & Brand Logo -->
          <tr>
            <td style="background-color: #064e3b; padding: 24px 20px; text-align: center;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; direction: rtl; text-align: center;">
                      <span style="font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; vertical-align: middle;">هنر</span><span style="background-color: #FF9900; color: #000000; padding: 2px 7px; border-radius: 6px; margin-right: 3px; font-size: 21px; font-weight: 900; vertical-align: middle;">هاب</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 6px;">
                    <span style="color: #a7f3d0; font-size: 11.5px; font-weight: 500;">سامانه تخصصی دست‌سازه‌ها و هنرهای اصیل ایرانی</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Formal & Concise Content -->
          <tr>
            <td style="padding: 30px 28px 24px 28px;">
              <p style="margin: 0 0 10px 0; font-size: 15px; font-weight: 700; color: #1e293b; line-height: 1.6;">
                کاربر گرامی؛
              </p>
              <p style="margin: 0 0 20px 0; font-size: 13.5px; line-height: 1.8; color: #475569;">
                کد تایید یکبار مصرف شما جهت ورود و احراز هویت در سامانه هنرهاب:
              </p>

              <!-- Prominent, Large OTP Box (Digits Only) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0 24px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #ecfdf5; border: 2px dashed #059669; border-radius: 16px; padding: 18px 36px; display: inline-block; text-align: center; -webkit-user-select: all; -moz-user-select: all; user-select: all; cursor: pointer;">
                      <span style="font-family: 'Vazirmatn', 'Courier New', monospace; font-size: 44px; font-weight: 900; color: #064e3b; letter-spacing: 14px; display: inline-block; direction: ltr; line-height: 1; -webkit-user-select: all; user-select: all;">
                        ${code}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Compact Expiry & Security Notice -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.8; color: #334155;">
                  ⏱ <strong>مدت اعتبار:</strong> این کد به مدت <strong>۲ دقیقه</strong> معتبر است.<br>
                  🔒 <strong>محرمانگی:</strong> این کد محرمانه است؛ آن را با هیچ‌کس به اشتراک نگذارید.
                </p>
              </div>

              <p style="margin: 0; font-size: 11.5px; color: #94a3b8; line-height: 1.6;">
                چنانچه شما درخواست این کد را ثبت نکرده‌اید، این پیام را نادیده بگیرید.
              </p>
            </td>
          </tr>

          <!-- Lightweight Support & Communication Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 18px 24px; border-top: 1px solid #f1f5f9;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <span style="font-size: 11.5px; font-weight: 700; color: #475569;">
                      مرکز ارتباط و پشتیبانی هنرهاب:
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0 6px;">
                          <a href="mailto:support@honarhub.ir" style="font-size: 11px; color: #059669; text-decoration: none; font-weight: 600;">
                            ✉️ support@honarhub.ir
                          </a>
                        </td>
                        <td style="color: #cbd5e1; font-size: 11px;">|</td>
                        <td style="padding: 0 6px;">
                          <a href="https://honarhub.ir/support" style="font-size: 11px; color: #059669; text-decoration: none; font-weight: 600;">
                            💬 تماس با پشتیبانی
                          </a>
                        </td>
                        <td style="color: #cbd5e1; font-size: 11px;">|</td>
                        <td style="padding: 0 6px;">
                          <a href="https://honarhub.ir" style="font-size: 11px; color: #059669; text-decoration: none; font-weight: 600;">
                            🌐 honarhub.ir
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 10px;">
                    <p style="margin: 0; font-size: 10.5px; color: #94a3b8; direction: ltr;">
                      © HonarHub. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
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
 * Modern, formal, lightweight Persian HTML template for Password Reset emails
 */
export function renderPasswordResetEmailHtml(code: string): string {
  return `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>بازیابی رمز عبور هنرهاب</title>
  <!-- Vazirmatn Font for supporting email clients -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700;800;900&display=swap" rel="stylesheet" type="text/css">
  <style type="text/css">
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700;800;900&display=swap');
    body, table, td, p, a, span, h1, h2, h3 {
      font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Tahoma, Arial, sans-serif !important;
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Vazirmatn', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Tahoma, Arial, sans-serif; direction: rtl; text-align: right; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f1f5f9; padding: 36px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 18px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Lightweight Header & Brand Logo -->
          <tr>
            <td style="background-color: #064e3b; padding: 24px 20px; text-align: center;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; direction: rtl; text-align: center;">
                      <span style="font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: -0.5px; vertical-align: middle;">هنر</span><span style="background-color: #FF9900; color: #000000; padding: 2px 7px; border-radius: 6px; margin-right: 3px; font-size: 21px; font-weight: 900; vertical-align: middle;">هاب</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 6px;">
                    <span style="color: #a7f3d0; font-size: 11.5px; font-weight: 500;">بازیابی رمز عبور حساب کاربری</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Formal & Concise Content -->
          <tr>
            <td style="padding: 30px 28px 24px 28px;">
              <p style="margin: 0 0 10px 0; font-size: 15px; font-weight: 700; color: #1e293b; line-height: 1.6;">
                کاربر گرامی؛
              </p>
              <p style="margin: 0 0 20px 0; font-size: 13.5px; line-height: 1.8; color: #475569;">
                کد تایید یکبار مصرف شما جهت بازنشانی و تغییر رمز عبور در سامانه هنرهاب:
              </p>

              <!-- Prominent, Large OTP Box (Digits Only) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0 24px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #eff6ff; border: 2px dashed #2563eb; border-radius: 16px; padding: 18px 36px; display: inline-block; text-align: center; -webkit-user-select: all; -moz-user-select: all; user-select: all; cursor: pointer;">
                      <span style="font-family: 'Vazirmatn', 'Courier New', monospace; font-size: 44px; font-weight: 900; color: #1e40af; letter-spacing: 14px; display: inline-block; direction: ltr; line-height: 1; -webkit-user-select: all; user-select: all;">
                        ${code}
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Compact Expiry & Security Notice -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px 16px; margin-bottom: 20px;">
                <p style="margin: 0; font-size: 12px; line-height: 1.8; color: #334155;">
                  ⏱ <strong>مدت اعتبار:</strong> این کد به مدت <strong>۲ دقیقه</strong> معتبر است.<br>
                  🔒 <strong>امنیت:</strong> در صورت عدم ثبت این درخواست توسط شما، رمز عبور فعلی همچنان فعال است و تغییری ایجاد نخواهد شد.
                </p>
              </div>

              <p style="margin: 0; font-size: 11.5px; color: #94a3b8; line-height: 1.6;">
                جهت حفظ امنیت حساب، این کد را در اختیار اشخاص دیگر قرار ندهید.
              </p>
            </td>
          </tr>

          <!-- Lightweight Support & Communication Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 18px 24px; border-top: 1px solid #f1f5f9;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom: 8px;">
                    <span style="font-size: 11.5px; font-weight: 700; color: #475569;">
                      مرکز ارتباط و پشتیبانی هنرهاب:
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 0 6px;">
                          <a href="mailto:support@honarhub.ir" style="font-size: 11px; color: #059669; text-decoration: none; font-weight: 600;">
                            ✉️ support@honarhub.ir
                          </a>
                        </td>
                        <td style="color: #cbd5e1; font-size: 11px;">|</td>
                        <td style="padding: 0 6px;">
                          <a href="https://honarhub.ir/support" style="font-size: 11px; color: #059669; text-decoration: none; font-weight: 600;">
                            💬 تماس با پشتیبانی
                          </a>
                        </td>
                        <td style="color: #cbd5e1; font-size: 11px;">|</td>
                        <td style="padding: 0 6px;">
                          <a href="https://honarhub.ir" style="font-size: 11px; color: #059669; text-decoration: none; font-weight: 600;">
                            🌐 honarhub.ir
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 10px;">
                    <p style="margin: 0; font-size: 10.5px; color: #94a3b8; direction: ltr;">
                      © HonarHub. All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
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
      subject: `کد آزمایشی هنرهاب: ${testCode}`,
      html: renderOtpEmailHtml(testCode)
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
