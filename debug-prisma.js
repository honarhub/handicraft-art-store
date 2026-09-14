const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  try {
    const artist = await prisma.artistProfile.findFirst({
        where: { pendingEdits: { not: Prisma.DbNull } }
    });
    console.log("Artist found:", !!artist);
    if (!artist) return;
    
    console.log("Pending edits:", typeof artist.pendingEdits, JSON.stringify(artist.pendingEdits));
    const edits = artist.pendingEdits;
    
    try {
      const updated = await prisma.artistProfile.update({
        where: { id: artist.id },
        data: {
          bio: edits.bio,
          portfolioUrl: edits.portfolioUrl,
          socialLinks: edits.socialLinks || Prisma.DbNull,
          ...(edits.specialties ? {
            specialties: {
              set: edits.specialties.map(s => ({ id: s.id }))
            }
          } : {}),
          pendingEdits: Prisma.DbNull,
          adminFeedback: null,
          user: {
            update: {
              name: edits.name
            }
          }
        }
      });
      console.log("Update success!");
    } catch(e) {
      console.log("UPDATE ERROR:", e);
    }
  } catch(e) {
    console.log("FIND ERROR:", e);
  }
}
run().finally(() => prisma.$disconnect());
