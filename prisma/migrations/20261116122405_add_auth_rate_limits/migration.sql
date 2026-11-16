-- CreateTable
CREATE TABLE "AuthRateLimit" (
    "action" VARCHAR(32) NOT NULL,
    "keyHash" CHAR(64) NOT NULL,
    "attemptCount" INTEGER NOT NULL,
    "windowStartedAt" TIMESTAMPTZ(3) NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "AuthRateLimit_pkey" PRIMARY KEY ("action","keyHash")
);

-- CreateIndex
CREATE INDEX "AuthRateLimit_expiresAt_idx" ON "AuthRateLimit"("expiresAt");
