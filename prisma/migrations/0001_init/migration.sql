-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "nominalRatePct" DECIMAL(6,3) NOT NULL,
    "setupFeeEur" DECIMAL(10,2) NOT NULL,
    "monthlyFeeEur" DECIMAL(10,2) NOT NULL,
    "minAmountEur" INTEGER NOT NULL,
    "maxAmountEur" INTEGER NOT NULL,
    "minTermMonths" INTEGER NOT NULL,
    "maxTermMonths" INTEGER NOT NULL,
    "notes" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faq" (
    "id" SERIAL NOT NULL,
    "topic" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "keywords" TEXT[],
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Calculation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "amountEur" DECIMAL(12,2) NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "monthlyNetIncomeEur" DECIMAL(12,2) NOT NULL,
    "existingDebtEur" DECIMAL(12,2) NOT NULL,
    "monthlyPaymentEur" DECIMAL(12,2) NOT NULL,
    "totalRepaymentEur" DECIMAL(12,2) NOT NULL,
    "totalCostEur" DECIMAL(12,2) NOT NULL,
    "dstiPct" DECIMAL(7,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Calculation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Faq_question_key" ON "Faq"("question");

-- CreateIndex
CREATE INDEX "Faq_topic_idx" ON "Faq"("topic");

-- CreateIndex
CREATE INDEX "Calculation_createdAt_idx" ON "Calculation"("createdAt");

-- AddForeignKey
ALTER TABLE "Calculation" ADD CONSTRAINT "Calculation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

