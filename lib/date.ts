/**
 * Utility functions for Persian (Jalali/Shamsi) date and time formatting
 * Always formatted strictly in Iran Standard Time (Asia/Tehran) with Persian numerals.
 */

export const toPersianDigits = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined) return '';
  const pDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/\d/g, (d) => pDigits[+d]);
};

export function parseDate(date: string | number | Date | null | undefined): Date | null {
  if (!date) return null;
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format date in Persian calendar and Iran timezone (e.g. "۱۴۰۳/۰۸/۱۴" or "۱۴ آبان ۱۴۰۳")
 */
export function formatPersianDate(
  date: string | number | Date | null | undefined,
  options?: { format?: 'numeric' | 'short' | 'long' }
): string {
  const d = parseDate(date);
  if (!d) return '—';

  const style = options?.format || 'numeric';

  try {
    if (style === 'numeric') {
      return new Intl.DateTimeFormat('fa-IR', {
        timeZone: 'Asia/Tehran',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).format(d);
    }

    return new Intl.DateTimeFormat('fa-IR', {
      timeZone: 'Asia/Tehran',
      year: 'numeric',
      month: style === 'short' ? 'short' : 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return '—';
  }
}

/**
 * Format time in Iran Standard Time (e.g. "۰۹:۳۰" or "۰۹:۳۰:۴۵")
 */
export function formatPersianTime(
  date: string | number | Date | null | undefined,
  includeSeconds = false
): string {
  const d = parseDate(date);
  if (!d) return '—';

  try {
    return new Intl.DateTimeFormat('fa-IR', {
      timeZone: 'Asia/Tehran',
      hour: '2-digit',
      minute: '2-digit',
      ...(includeSeconds ? { second: '2-digit' } : {}),
      hour12: false,
    }).format(d);
  } catch {
    return '—';
  }
}

/**
 * Format both date and time in Iran Standard Time (e.g. "۱۴۰۳/۰۸/۱۴ - ساعت ۰۹:۳۰" or "۱۴ آبان ۱۴۰۳ - ساعت ۰۹:۳۰")
 */
export function formatPersianDateTime(
  date: string | number | Date | null | undefined,
  options?: { format?: 'numeric' | 'short' | 'long'; includeSeconds?: boolean }
): string {
  const d = parseDate(date);
  if (!d) return '—';

  try {
    const dateStr = formatPersianDate(d, { format: options?.format || 'numeric' });
    const timeStr = formatPersianTime(d, options?.includeSeconds);
    return `${dateStr} - ساعت ${timeStr}`;
  } catch {
    return '—';
  }
}

/**
 * Formats full header date (e.g. "دوشنبه، ۱۴ آبان ۱۴۰۳")
 */
export function formatPersianFullDate(
  date: string | number | Date | null | undefined = new Date()
): string {
  const d = parseDate(date) || new Date();
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      timeZone: 'Asia/Tehran',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return '—';
  }
}
