import packageJson from '@/package.json';

export const APP_VERSION = packageJson.version;

export function getPersianVersion(): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return APP_VERSION.replace(/[0-9]/g, (w) => persianDigits[+w]);
}
