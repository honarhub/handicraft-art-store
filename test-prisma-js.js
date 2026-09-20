import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const dynamicRows = [{ id: 'test', type: 'NEWEST', value: '', title: 'Test', isActive: true, order: 0 }];
    const settings = await prisma.siteSettings.upsert({
      where: { id: 'default' },
      update: { dynamicRows: JSON.stringify(dynamicRows) },
      create: { 
        id: 'default', 
        featuredSpecialtyId: null,
        dynamicRows: JSON.stringify(dynamicRows)
      }
    });
    console.log('Success:', settings);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
main();
