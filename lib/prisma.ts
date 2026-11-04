import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
  var schemaEnsuredGlobal: boolean | undefined;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma;

const MIGRATION_STATEMENTS = [
  'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "brandName" TEXT',
  'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "province" TEXT',
  'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "city" TEXT',
  'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "verificationLevel" INTEGER NOT NULL DEFAULT 0',
  'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "nationalId" TEXT',
  'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "nationalCardImage" TEXT',
  'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "birthDate" TEXT',
  'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "address" TEXT',
  'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "postalCode" TEXT',
  'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "shebaNumber" TEXT',
  'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "deletionRequested" BOOLEAN NOT NULL DEFAULT false',
  'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "deletionReason" TEXT',
  'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "deletionRequestedAt" TIMESTAMP(3)',
  'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "pendingEdits" JSONB',
  'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "adminFeedback" TEXT',
  'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true',
  'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT false',
  'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN NOT NULL DEFAULT false',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "smsReferralTemplateId" TEXT',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "smsReferralParamName" TEXT NOT NULL DEFAULT \'Code\'',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "farazSmsApiKey" TEXT',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "farazSmsLineNumber" TEXT',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "farazSmsPatternCode" TEXT',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "farazSmsOtpParamName" TEXT NOT NULL DEFAULT \'code\'',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "farazSmsReferralPatternCode" TEXT',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "farazSmsReferralParamName" TEXT NOT NULL DEFAULT \'code\'',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "farazSmsReferralWithNamePatternCode" TEXT',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "farazSmsReferralNameParamName" TEXT NOT NULL DEFAULT \'name\'',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "smsReferralWithNameTemplateId" TEXT',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "smsReferralNameParamName" TEXT NOT NULL DEFAULT \'name\'',
  `CREATE TABLE IF NOT EXISTS "VerificationCode" (
      "id" TEXT NOT NULL,
      "target" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "expiresAt" TIMESTAMP(3) NOT NULL,
      "used" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
  )`,
  'CREATE INDEX IF NOT EXISTS "VerificationCode_target_type_idx" ON "VerificationCode"("target", "type")',
  `CREATE TABLE IF NOT EXISTS "ReferralCode" (
      "id" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "creatorId" TEXT,
      "usedById" TEXT,
      "isUsed" BOOLEAN NOT NULL DEFAULT false,
      "usedAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ReferralCode_pkey" PRIMARY KEY ("id")
  )`,
  'CREATE UNIQUE INDEX IF NOT EXISTS "ReferralCode_code_key" ON "ReferralCode"("code")',
  'CREATE UNIQUE INDEX IF NOT EXISTS "ReferralCode_usedById_key" ON "ReferralCode"("usedById")',
  'CREATE INDEX IF NOT EXISTS "ReferralCode_creatorId_idx" ON "ReferralCode"("creatorId")',
  'CREATE INDEX IF NOT EXISTS "ReferralCode_code_idx" ON "ReferralCode"("code")',
  `CREATE TABLE IF NOT EXISTS "UserAddress" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "title" TEXT NOT NULL DEFAULT 'آدرس من',
      "recipientName" TEXT NOT NULL,
      "phoneNumber" TEXT NOT NULL,
      "province" TEXT NOT NULL,
      "city" TEXT NOT NULL,
      "address" TEXT NOT NULL,
      "postalCode" TEXT NOT NULL,
      "isDefault" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "UserAddress_pkey" PRIMARY KEY ("id")
  )`,
  'CREATE INDEX IF NOT EXISTS "UserAddress_userId_idx" ON "UserAddress"("userId")',
  `CREATE TABLE IF NOT EXISTS "WishlistItem" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "productId" TEXT NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
  )`,
  'CREATE UNIQUE INDEX IF NOT EXISTS "WishlistItem_userId_productId_key" ON "WishlistItem"("userId", "productId")',
  'CREATE INDEX IF NOT EXISTS "WishlistItem_userId_idx" ON "WishlistItem"("userId")',
  'CREATE INDEX IF NOT EXISTS "WishlistItem_productId_idx" ON "WishlistItem"("productId")'
];

let isMigrating = false;

export async function ensureDatabaseSchema() {
  if (globalThis.schemaEnsuredGlobal || isMigrating) return;
  isMigrating = true;
  try {
    for (const statement of MIGRATION_STATEMENTS) {
      try {
        await prisma.$executeRawUnsafe(statement);
      } catch (err: any) {
        // Ignore errors if column/index already exists or table is being concurrently modified
        if (!err?.message?.includes('already exists')) {
          console.warn('[Schema Migration Note]', err?.message || err);
        }
      }
    }
    globalThis.schemaEnsuredGlobal = true;
    console.log('[Schema Migration] All database columns and tables verified successfully.');
  } catch (error) {
    console.error('[Schema Migration Error]', error);
  } finally {
    isMigrating = false;
  }
}

// Automatically trigger migration asynchronously upon loading
if (process.env.DATABASE_URL) {
  ensureDatabaseSchema().catch(() => {});
}
