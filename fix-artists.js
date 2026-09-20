const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const updated = await prisma.artistProfile.updateMany({
    where: { isApproved: false },
    data: { isActive: false }
  });
  console.log(`Updated ${updated.count} pending artists to be inactive`);
  await prisma.$disconnect();
}
main();
