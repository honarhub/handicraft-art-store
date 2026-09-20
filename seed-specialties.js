const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const specialties = [
  'سفالگری', 'کاشیکاری', 'مینیاتور', 'خوشنویسی', 'تذهیب',
  'گلیمبافی', 'قالیبافی', 'جاجیمبافی',
  'معرقکاری', 'خاتمکاری', 'منبتکاری',
  'میناکاری', 'ملیلهکاری', 'قلمزنی', 'فیروزهکوبی',
  'زیلوبافی', 'نمدمالی',
  'سوزندوزی', 'پتهدوزی', 'ترمهبافی', 'گلابتوندوزی',
  'چاپ باتیک', 'گلآرایی سنتی',
  'نقاشی روی چرم', 'نقاشی روی شیشه', 'ویترای',
  'رزینکاری', 'بافتنی و قلاببافی',
  'مجسمهسازی',
  'حکاکی روی فلز', 'حکاکی روی چوب', 'حکاکی روی سنگ',
  'جواهرسازی سنتی', 'چرمدوزی دستساز',
  'شمعسازی هنری', 'ماکرامهبافی',
  'گچبری', 'آینهکاری', 'کندهکاری',
  'نقاشی (رنگروغن)', 'نقاشی (آبرنگ)', 'طراحی (سیاهقلم)',
  'عروسکسازی سنتی', 'سبدبافی', 'حصیربافی', 'شبکهبری'
];

async function seed() {
  console.log('🌱 شروع افزودن تخصصهای پیشفرض...\n');
  
  let created = 0;
  let skipped = 0;
  
  for (const name of specialties) {
    const existing = await prisma.specialty.findUnique({ where: { name } });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.specialty.create({
      data: { name, isApproved: true }
    });
    created++;
    console.log(`  ✅ ${name}`);
  }
  
  console.log(`\n🎉 تمام! ${created} تخصص جدید اضافه شد. ${skipped} مورد قبلاً وجود داشت.`);
}

seed()
  .catch(e => {
    console.error('❌ خطا:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
