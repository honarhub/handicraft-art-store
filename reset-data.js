const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function resetData() {
  console.log('🔄 شروع پاکسازی داده‌ها...\n');

  // ترتیب حذف مهم است (به خاطر Foreign Key ها)
  
  const stockNotifications = await prisma.stockNotification.deleteMany({});
  console.log(`✅ StockNotification: ${stockNotifications.count} رکورد حذف شد`);

  const supportMessages = await prisma.supportMessage.deleteMany({});
  console.log(`✅ SupportMessage: ${supportMessages.count} رکورد حذف شد`);

  const certificates = await prisma.productCertificate.deleteMany({});
  console.log(`✅ ProductCertificate: ${certificates.count} رکورد حذف شد`);

  const orderItems = await prisma.orderItem.deleteMany({});
  console.log(`✅ OrderItem: ${orderItems.count} رکورد حذف شد`);

  const orders = await prisma.order.deleteMany({});
  console.log(`✅ Order: ${orders.count} رکورد حذف شد`);

  const pricingTiers = await prisma.pricingTier.deleteMany({});
  console.log(`✅ PricingTier: ${pricingTiers.count} رکورد حذف شد`);

  const transactions = await prisma.transaction.deleteMany({});
  console.log(`✅ Transaction: ${transactions.count} رکورد حذف شد`);

  const products = await prisma.product.deleteMany({});
  console.log(`✅ Product: ${products.count} رکورد حذف شد`);

  const artistProfiles = await prisma.artistProfile.deleteMany({});
  console.log(`✅ ArtistProfile: ${artistProfiles.count} رکورد حذف شد`);

  // حذف تمام کاربران به جز ادمین
  const nonAdminUsers = await prisma.user.deleteMany({
    where: { role: { not: 'ADMIN' } }
  });
  console.log(`✅ User (غیر ادمین): ${nonAdminUsers.count} رکورد حذف شد`);

  const specialties = await prisma.specialty.deleteMany({});
  console.log(`✅ Specialty: ${specialties.count} رکورد حذف شد`);

  const siteSettings = await prisma.siteSettings.deleteMany({});
  console.log(`✅ SiteSettings: ${siteSettings.count} رکورد حذف شد`);

  const passwordResetTokens = await prisma.passwordResetToken.deleteMany({});
  console.log(`✅ PasswordResetToken: ${passwordResetTokens.count} رکورد حذف شد`);

  console.log('\n🎉 تمام داده‌ها پاک شد! سایت آماده تست از صفر است.');
  console.log('ℹ️  اکانت ادمین حفظ شده است.');
}

resetData()
  .catch(e => {
    console.error('❌ خطا:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
