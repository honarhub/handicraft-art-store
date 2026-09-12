const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const defaultSpecialties = [
  "میناکاری", "خاتم‌کاری", "قلم‌زنی", "سفالگری", "فیروزه‌کوبی",
  "منبت‌کاری", "معرق‌کاری", "فرش‌بافی", "گلیم‌بافی", "جاجیم‌بافی",
  "نقاشی خط", "مینیاتور", "تذهیب", "سوزن‌دوزی", "ترمه‌دوزی",
  "حصیربافی", "ملیله‌کاری", "مسگری", "شیشه‌گری", "نگارگری",
  "پته‌دوزی", "سرمه‌دوزی", "قالی‌بافی", "کاشی‌کاری", "سفال‌گری"
];

async function main() {
  console.log("Seeding default specialties...");
  for (const name of defaultSpecialties) {
    await prisma.specialty.upsert({
      where: { name },
      update: {},
      create: { name, isApproved: true },
    });
  }
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
