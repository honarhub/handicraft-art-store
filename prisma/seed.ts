import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding mock data...');

  // 1. ایجاد استاد محمود فرشچیان
  const farshchian = await prisma.user.upsert({
    where: { email: 'farshchian@mock.com' },
    update: {},
    create: {
      email: 'farshchian@mock.com',
      name: 'استاد محمود فرشچیان',
      role: 'ARTIST',
      artistProfile: {
        create: {
          bio: 'استاد محمود فرشچیان، از برجسته‌ترین نقاشان و مینیاتوریست‌های معاصر ایران است. آثار او تلفیقی از اصالت هنر اصیل ایرانی با تکنیک‌های مدرن و رنگ‌آمیزی بی‌نظیر است که شهرت جهانی دارد.',
          specialties: {
            create: [
              { name: 'مینیاتور' },
              { name: 'نگارگری' },
              { name: 'نقاشی' }
            ]
          },
          portfolioUrl: 'https://farshchianart.com'
        }
      }
    }
  });

  console.log('Created Mock Artist:', farshchian.name);

  // 2. ایجاد ادمین پیش‌فرض
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mydomain.com' },
    update: {},
    create: {
      email: 'admin@mydomain.com',
      name: 'مدیر کل سایت',
      password: 'password123', // در محیط واقعی این باید هش شده باشد (Bcrypt)
      role: 'ADMIN'
    }
  });

  console.log('Created Admin User:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
