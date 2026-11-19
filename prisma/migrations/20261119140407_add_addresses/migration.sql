-- CreateTable
CREATE TABLE "Address" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "recipient" VARCHAR(120) NOT NULL,
    "postalCode" CHAR(8) NOT NULL,
    "street" VARCHAR(160) NOT NULL,
    "number" VARCHAR(30),
    "hasNoNumber" BOOLEAN NOT NULL DEFAULT false,
    "complement" VARCHAR(120),
    "district" VARCHAR(120),
    "city" VARCHAR(120) NOT NULL,
    "state" CHAR(2) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Address_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Address_postalCode_format_check" CHECK ("postalCode" ~ '^[0-9]{8}$'),
    CONSTRAINT "Address_state_check" CHECK ("state" IN (
        'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
        'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
        'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    )),
    CONSTRAINT "Address_number_check" CHECK (
        ("hasNoNumber" = true AND "number" IS NULL)
        OR
        ("hasNoNumber" = false AND "number" IS NOT NULL AND btrim("number") <> '')
    )
);

-- CreateIndex
CREATE INDEX "Address_userId_createdAt_idx" ON "Address"("userId", "createdAt");

-- A partial unique index allows many non-default addresses and only one default per user.
CREATE UNIQUE INDEX "Address_one_default_per_user_idx"
ON "Address"("userId")
WHERE "isDefault" = true;

-- AddForeignKey
ALTER TABLE "Address" ADD CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
