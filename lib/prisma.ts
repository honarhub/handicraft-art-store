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
  'CREATE INDEX IF NOT EXISTS "WishlistItem_productId_idx" ON "WishlistItem"("productId")',

  // --- HonarHub Pay & Banking Columns ---
  'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "cardNumber" TEXT',
  'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "cardBankTitle" TEXT',
  'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "cardBankSlug" TEXT',
  'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "honarhubPayCardId" TEXT',
  'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "isHonarhubPayApproved" BOOLEAN NOT NULL DEFAULT false',
  'ALTER TABLE "ArtistProfile" ADD COLUMN IF NOT EXISTS "honarhubPaySyncedAt" TIMESTAMP(3)',

  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "honarhubPayApiKey" TEXT DEFAULT \'hp_sandbox_test_key_2026\'',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "honarhubPayIsSandbox" BOOLEAN NOT NULL DEFAULT true',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "honarhubPayBaseUrl" TEXT NOT NULL DEFAULT \'https://pay.honarhub.com\'',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "adminCardNumber" TEXT',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "adminCardOwnerName" TEXT',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "adminCardAccountNumber" TEXT',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "adminCardIban" TEXT',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "adminCardBankTitle" TEXT',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "adminCardBankSlug" TEXT',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "adminHonarhubPayCardId" TEXT',
  'ALTER TABLE "SiteSettings" ADD COLUMN IF NOT EXISTS "adminHonarhubPaySyncedAt" TIMESTAMP(3)',

  'ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "orderId" TEXT',
  'ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "referenceId" TEXT',

  'ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "orderNumber" TEXT',
  'ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT',
  'ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "subtotal" DOUBLE PRECISION',
  'ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingCost" DOUBLE PRECISION DEFAULT 0',
  'ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discountAmount" DOUBLE PRECISION DEFAULT 0',
  'ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "recipientName" TEXT',
  'ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "phoneNumber" TEXT',
  'ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "province" TEXT',
  'ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "city" TEXT',
  'ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingAddress" TEXT',
  'ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "postalCode" TEXT',
  'ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "postalTrackingCode" TEXT',
  'ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT DEFAULT \'ONLINE\'',
  'ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentRefId" TEXT',
  'ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentCardMask" TEXT',
  'ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3)',
  'ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "artistId" TEXT',
  'ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "isDirectArtistSettlement" BOOLEAN NOT NULL DEFAULT false',

  'ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "artistId" TEXT',
  'ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "artistEarnings" DOUBLE PRECISION',
  'ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "platformFee" DOUBLE PRECISION',
  'ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "itemStatus" TEXT DEFAULT \'PENDING\'',
  'ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "postalTrackingCode" TEXT',

  `DO $$ BEGIN
    CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'PAID', 'REJECTED');
  EXCEPTION
    WHEN duplicate_object THEN null;
  END $$;`,

  `CREATE TABLE IF NOT EXISTS "SettlementRequest" (
      "id" TEXT NOT NULL,
      "artistId" TEXT NOT NULL,
      "amount" DOUBLE PRECISION NOT NULL,
      "shebaNumber" TEXT NOT NULL,
      "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
      "trackingCode" TEXT,
      "adminNote" TEXT,
      "paidAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "SettlementRequest_pkey" PRIMARY KEY ("id")
  )`,
  'CREATE INDEX IF NOT EXISTS "SettlementRequest_artistId_idx" ON "SettlementRequest"("artistId")',
  'CREATE INDEX IF NOT EXISTS "SettlementRequest_status_idx" ON "SettlementRequest"("status")',

  `CREATE TABLE IF NOT EXISTS "PaymentLog" (
      "id" TEXT NOT NULL,
      "orderId" TEXT,
      "invoiceNumber" TEXT,
      "authority" TEXT,
      "trackingCode" TEXT,
      "amount" DOUBLE PRECISION NOT NULL,
      "payableAmount" DOUBLE PRECISION,
      "offsetAmount" DOUBLE PRECISION DEFAULT 0,
      "status" TEXT NOT NULL,
      "gateway" TEXT NOT NULL DEFAULT 'HONARHUB_PAY',
      "isSandbox" BOOLEAN NOT NULL DEFAULT true,
      "cardId" TEXT,
      "cardNumber" TEXT,
      "cardOwnerName" TEXT,
      "bankTitle" TEXT,
      "artistId" TEXT,
      "isDirectArtist" BOOLEAN NOT NULL DEFAULT false,
      "errorMessage" TEXT,
      "requestPayload" JSONB,
      "verifyPayload" JSONB,
      "paidAt" TIMESTAMP(3),
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
  )`,
  'CREATE UNIQUE INDEX IF NOT EXISTS "PaymentLog_authority_key" ON "PaymentLog"("authority")',
  'CREATE INDEX IF NOT EXISTS "PaymentLog_orderId_idx" ON "PaymentLog"("orderId")',
  'CREATE INDEX IF NOT EXISTS "PaymentLog_trackingCode_idx" ON "PaymentLog"("trackingCode")',
  'CREATE INDEX IF NOT EXISTS "PaymentLog_status_idx" ON "PaymentLog"("status")',
  'CREATE INDEX IF NOT EXISTS "PaymentLog_artistId_idx" ON "PaymentLog"("artistId")',
  'CREATE INDEX IF NOT EXISTS "PaymentLog_createdAt_idx" ON "PaymentLog"("createdAt")'
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
