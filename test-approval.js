const { PrismaClient, Prisma } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const artist = await prisma.artistProfile.findFirst({
    where: { pendingEdits: { not: Prisma.AnyNull } }
  });
  
  if (!artist) {
    console.log("No artist with pending edits found.");
    return;
  }
  
  console.log("Pending edits:", artist.pendingEdits);
  
  const edits = artist.pendingEdits;
  
  try {
    const updatedArtist = await prisma.artistProfile.update({
        where: { id: artist.id },
        data: {
          bio: edits.bio,
          portfolioUrl: edits.portfolioUrl,
          socialLinks: edits.socialLinks || Prisma.DbNull,
          ...(Array.isArray(edits.specialties) ? {
            specialties: {
              set: edits.specialties.map((s) => ({ id: s.id }))
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
      console.log("Success!", updatedArtist.id);
  } catch (err) {
      console.error("Prisma Error:", err);
  }
}
main().finally(() => prisma.$disconnect());
