const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categoryHierarchy = [
  {
    name: 'نقاشی، نگارگری و خوشنویسی',
    children: [
      'مینیاتور',
      'تذهیب',
      'خوشنویسی',
      'نقاشی (رنگ روغن)',
      'نقاشی (آبرنگ)',
      'طراحی (سیاه قلم)',
      'نقاشی روی شیشه',
      'ویترای',
      'نقاشی روی چرم'
    ]
  },
  {
    name: 'سفال، سرامیک و آبگینه',
    children: [
      'سفالگری',
      'کاشی کاری'
    ]
  },
  {
    name: 'دست بافته ها و زیراندازهای سنتی',
    children: [
      'قالی بافی',
      'گلیم بافی',
      'جاجیم بافی',
      'زیلو بافی',
      'نمد مالی'
    ]
  },
  {
    name: 'صنایع دستی چوبی',
    children: [
      'معرق کاری',
      'خاتم کاری',
      'منبت کاری',
      'کنده کاری',
      'حکاکی روی چوب'
    ]
  },
  {
    name: 'هنرهای فلزی',
    children: [
      'مینا کاری',
      'ملیله کاری',
      'قلمزنی',
      'فیروزه کوبی',
      'حکاکی روی فلز',
      'شبکه بری'
    ]
  },
  {
    name: 'رودوزی ها و نساجی سنتی',
    children: [
      'سوزن دوزی',
      'پته دوزی',
      'ترمه بافی',
      'گلابتون دوزی',
      'چاپ باتیک',
      'بافتنی و قلاب بافی',
      'ماکرامه بافی'
    ]
  },
  {
    name: 'زیورآلات و جواهرسازی سنتی',
    children: [
      'جواهرسازی سنتی'
    ]
  },
  {
    name: 'چرم دوزی و سراجی سنتی',
    children: [
      'چرم دوزی دست ساز'
    ]
  },
  {
    name: 'هنرهای سنگی و احجام',
    children: [
      'حکاکی روی سنگ',
      'مجسمه سازی'
    ]
  },
  {
    name: 'حصیر بافی و بافت های بومی',
    children: [
      'حصیر بافی',
      'سبد بافی'
    ]
  },
  {
    name: 'تزیینات و معماری سنتی',
    children: [
      'گچبری',
      'آینه کاری'
    ]
  },
  {
    name: 'سایر هنرهای دستی و دکوراتیو',
    children: [
      'رزین کاری',
      'شمع سازی هنری',
      'عروسک سازی سنتی',
      'گل آرایی سنتی'
    ]
  }
];

async function seed() {
  console.log('🌱 شروع سازماندهی و افزودن درختواره دسته‌بندی‌ها و تخصص‌ها...\n');
  
  let masterCount = 0;
  let childCount = 0;
  let defaultParent = null;

  for (const group of categoryHierarchy) {
    let master = await prisma.specialty.findUnique({ where: { name: group.name } });
    if (!master) {
      master = await prisma.specialty.create({
        data: {
          name: group.name,
          parentId: null,
          isApproved: true
        }
      });
      masterCount++;
      console.log(`  📁 دسته‌بندی اصلی جدید: ${group.name}`);
    } else {
      if (master.parentId !== null) {
        master = await prisma.specialty.update({
          where: { id: master.id },
          data: { parentId: null }
        });
      }
      console.log(`  📂 دسته‌بندی اصلی موجود: ${group.name}`);
    }

    if (group.name === 'سایر هنرهای دستی و دکوراتیو') {
      defaultParent = master;
    }

    for (const childName of group.children) {
      const existingChild = await prisma.specialty.findUnique({ where: { name: childName } });
      if (existingChild) {
        await prisma.specialty.update({
          where: { id: existingChild.id },
          data: {
            parentId: master.id,
            isApproved: true
          }
        });
      } else {
        await prisma.specialty.create({
          data: {
            name: childName,
            parentId: master.id,
            isApproved: true
          }
        });
      }
      childCount++;
      console.log(`     ↳ 🏷️ زیرمجموعه: ${childName}`);
    }
  }

  // اگر تخصصی هنوز والد ندارد و جزو ۱۲ دسته اصلی نیست، آن را در "سایر هنرهای دستی و دکوراتیو" قرار می‌دهیم
  if (defaultParent) {
    const masterNames = categoryHierarchy.map(g => g.name);
    const orphanSpecialties = await prisma.specialty.findMany({
      where: {
        parentId: null,
        name: { notIn: masterNames }
      }
    });

    for (const orphan of orphanSpecialties) {
      await prisma.specialty.update({
        where: { id: orphan.id },
        data: { parentId: defaultParent.id }
      });
      console.log(`  ↪️ تخصص بدون والد به دسته پیش‌فرض متصل شد: ${orphan.name}`);
    }
  }

  console.log(`\n🎉 درختواره با موفقیت بروزرسانی شد! ${masterCount} دسته اصلی جدید، مجموعاً ۱۲ دسته اصلی و ${childCount} زیرمجموعه تایید شدند.`);
}

seed()
  .catch(e => {
    console.error('❌ خطا:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
