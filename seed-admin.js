const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Manually read .env file if process.env.ADMIN_EMAIL is not set
if (!process.env.ADMIN_EMAIL && fs.existsSync(path.join(__dirname, '.env'))) {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...values] = trimmed.split('=');
      if (key && values.length) {
        let val = values.join('=').trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key.trim()] = val;
      }
    }
  }
}

const prisma = new PrismaClient();

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@honarhub.com';
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'admin123456';
  const adminName = 'مدیر ارشد هنرهاب';

  console.log('🛡️  در حال آماده‌سازی و ساخت حساب ادمین...');
  console.log(`📧  ایمیل ادمین: ${adminEmail}`);

  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existingUser) {
    const updated = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        role: 'ADMIN',
        password: hashedPassword,
        name: existingUser.name || adminName
      }
    });
    console.log(`✅  حساب موجود با ایمیل ${adminEmail} به نقش ADMIN ارتقا یافت و رمز عبور آن تنظیم شد.`);
  } else {
    const created = await prisma.user.create({
      data: {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: 'ADMIN'
      }
    });
    console.log(`🎉  حساب مدیر ارشد جدید با موفقیت ایجاد شد!`);
  }

  console.log('----------------------------------------------------');
  console.log('اطلاعات ورود به کنترل پنل ادمین:');
  console.log(`🔗  آدرس ورود: http://localhost:3000/admin/login`);
  console.log(`👤  ایمیل: ${adminEmail}`);
  console.log(`🔑  رمز عبور: ${adminPassword}`);
  console.log('----------------------------------------------------');
}

seedAdmin()
  .catch((e) => {
    console.error('❌  خطا در ساخت حساب ادمین:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
