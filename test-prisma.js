const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const existing = await prisma.user.findUnique({ where: { email: 'test2@example.com' }});
    if (existing) {
      await prisma.user.delete({ where: { email: 'test2@example.com' } });
    }
    const user = await prisma.user.create({
      data: {
        name: 'Test Artist 2',
        email: 'test2@example.com',
        password: 'password123',
        role: 'ARTIST',
        artistProfile: {
          create: {
            isApproved: false,
            isActive: true,
          }
        }
      },
      include: {
        artistProfile: true
      }
    });
    console.log("Success:", user.id);
  } catch (e) {
    console.error("Prisma Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
