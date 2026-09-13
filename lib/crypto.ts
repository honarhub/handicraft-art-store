import crypto from 'crypto';

/**
 * تولید یک شناسنامه امن و هش شده بر اساس ترکیب داده‌ها و یک Salt رندوم
 * @param productId شناسه محصول
 * @param ownerId شناسه خریدار
 * @param timestamp زمان ثبت سفارش
 * @returns { hash, salt } هش تولید شده به همراه سالت
 */
export function generateDigitalCertificate(productId: string, ownerId: string, timestamp: number) {
  // تولید یک Salt کاملا رندوم و تصادفی برای جلوگیری از مهندسی معکوس
  const salt = crypto.randomBytes(16).toString('hex');
  
  const dataToHash = `${productId}:${ownerId}:${timestamp}:${salt}`;
  
  const hash = crypto.createHash('sha256').update(dataToHash).digest('hex');
  
  return { hash, salt };
}
