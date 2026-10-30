import prisma from '@/lib/prisma';
import { normalizePhoneNumber } from '@/lib/sms';

export interface OtpSecurityCheckResult {
  allowed: boolean;
  status: number;
  error?: string;
  siteSettings: any;
  clientIp: string;
  isMobileOtpDisabled?: boolean;
}

/**
 * Extracts client IP address from proxy / reverse-proxy headers
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map(s => s.trim());
    if (ips[0]) return ips[0];
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  const cfIp = req.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp.trim();
  return '127.0.0.1';
}

/**
 * Multi-layer security & anti-abuse checks for OTP requests:
 * 1. Mobile OTP Kill Switch
 * 2. Multi-target / Rapid-fire IP flooding protection
 * 3. Per-Target hourly quota
 * 4. Configurable cooldown interval
 */
export async function checkAndEnforceOtpLimits(
  req: Request,
  target: string,
  type: string,
  isEmail: boolean
): Promise<OtpSecurityCheckResult> {
  const clientIp = getClientIp(req);
  const normalizedTarget = isEmail ? target.trim().toLowerCase() : normalizePhoneNumber(target);

  // 1. Fetch current SiteSettings (or create default)
  let settings = await prisma.siteSettings.findUnique({ where: { id: 'default' } });
  if (!settings) {
    settings = await prisma.siteSettings.create({ data: { id: 'default' } });
  }

  // 2. Kill switch check for mobile OTP
  if (!isEmail && settings.isMobileOtpActive === false) {
    await prisma.otpRequestLog.create({
      data: {
        ip: clientIp,
        target: normalizedTarget,
        type,
        status: 'DISABLED',
        reason: 'سرویس پیامک توسط مدیریت غیرفعال شده است.'
      }
    });

    return {
      allowed: false,
      status: 403,
      error: 'ارسال رمز یکبار مصرف پیامکی موقتاً غیرفعال است. لطفاً از طریق ورود با رمز عبور یا ثبت‌نام با ایمیل اقدام فرمایید.',
      isMobileOtpDisabled: true,
      siteSettings: settings,
      clientIp
    };
  }

  const now = Date.now();

  // 3. Flood Protection (Anti-Rapid-fire / IP attacks across multiple numbers)
  const tenMinutesAgo = new Date(now - 10 * 60 * 1000);
  const maxPerTenMin = settings.otpMaxPerTenMinPerIp || 10;
  const lockoutMinutes = settings.otpLockoutMinutes || 15;

  // Check if IP is currently under active lockout
  const lockoutThreshold = new Date(now - lockoutMinutes * 60 * 1000);
  const recentLockoutRecord = await prisma.otpRequestLog.findFirst({
    where: {
      ip: clientIp,
      status: 'BLOCKED_IP_FLOOD',
      createdAt: { gte: lockoutThreshold }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (recentLockoutRecord) {
    const elapsedMinutes = Math.floor((now - recentLockoutRecord.createdAt.getTime()) / 60000);
    const remainingMinutes = Math.max(1, lockoutMinutes - elapsedMinutes);
    return {
      allowed: false,
      status: 429,
      error: `به دلیل ثبت درخواست‌های مکرر و رگباری از این دستگاه، دسترسی شما موقتاً برای ${remainingMinutes} دقیقه مسدود شده است. لطفاً بعداً تلاش فرمایید.`,
      siteSettings: settings,
      clientIp
    };
  }

  const ipRecentAttempts = await prisma.otpRequestLog.count({
    where: {
      ip: clientIp,
      createdAt: { gte: tenMinutesAgo }
    }
  });

  if (ipRecentAttempts >= maxPerTenMin) {
    await prisma.otpRequestLog.create({
      data: {
        ip: clientIp,
        target: normalizedTarget,
        type,
        status: 'BLOCKED_IP_FLOOD',
        reason: `بیش از ${maxPerTenMin} درخواست در ۱۰ دقیقه از این IP ثبت شد.`
      }
    });

    return {
      allowed: false,
      status: 429,
      error: `تعداد درخواست‌های ارسالی از این دستگاه بیش از حد مجاز است. دسترسی شما به مدت ${lockoutMinutes} دقیقه مسدود گردید.`,
      siteSettings: settings,
      clientIp
    };
  }

  // 4. Per-Target Hourly Cap (سقف ارسال به یک شماره در ساعت)
  if (!isEmail) {
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const maxPerHour = settings.otpMaxPerHourPerPhone || 5;

    const phoneSentCount = await prisma.otpRequestLog.count({
      where: {
        target: normalizedTarget,
        status: 'SENT',
        createdAt: { gte: oneHourAgo }
      }
    });

    if (phoneSentCount >= maxPerHour) {
      await prisma.otpRequestLog.create({
        data: {
          ip: clientIp,
          target: normalizedTarget,
          type,
          status: 'BLOCKED_PHONE_CAP',
          reason: `بیش از ${maxPerHour} پیامک به این شماره در یک ساعت ارسال شده است.`
        }
      });

      return {
        allowed: false,
        status: 429,
        error: 'تعداد درخواست‌های کد تایید برای این شماره در این ساعت به حد نصاب رسیده است. لطفاً ۱ ساعت دیگر تلاش نمایید.',
        siteSettings: settings,
        clientIp
      };
    }
  }

  // 5. Cooldown (فاصله زمانی بین پیامک‌های مجدد)
  const resendIntervalSec = settings.otpResendIntervalSeconds || 60;
  const cooldownThreshold = new Date(now - resendIntervalSec * 1000);

  const recentCode = await prisma.verificationCode.findFirst({
    where: {
      target: normalizedTarget,
      type,
      createdAt: { gte: cooldownThreshold },
      used: false
    },
    orderBy: { createdAt: 'desc' }
  });

  if (recentCode) {
    const waitSeconds = Math.ceil((recentCode.createdAt.getTime() + resendIntervalSec * 1000 - now) / 1000);
    await prisma.otpRequestLog.create({
      data: {
        ip: clientIp,
        target: normalizedTarget,
        type,
        status: 'BLOCKED_COOLDOWN',
        reason: `درخواست قبل از پایان فاصله زمانی ${resendIntervalSec} ثانیه.`
      }
    });

    return {
      allowed: false,
      status: 429,
      error: `لطفاً ${waitSeconds > 0 ? waitSeconds : 10} ثانیه صبر کرده و سپس مجدداً تلاش کنید.`,
      siteSettings: settings,
      clientIp
    };
  }

  return {
    allowed: true,
    status: 200,
    siteSettings: settings,
    clientIp
  };
}

export async function logOtpSent(ip: string, target: string, type: string) {
  try {
    await prisma.otpRequestLog.create({
      data: {
        ip,
        target,
        type,
        status: 'SENT'
      }
    });
  } catch (e) {
    console.error('Error logging sent OTP:', e);
  }
}

export async function logOtpFailure(ip: string, target: string, type: string, reason: string) {
  try {
    await prisma.otpRequestLog.create({
      data: {
        ip,
        target,
        type,
        status: 'FAILED_GATEWAY',
        reason
      }
    });
  } catch (e) {
    console.error('Error logging failed OTP:', e);
  }
}
