-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant');

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
CREATE TABLE "FAQ" (
    "id" SERIAL NOT NULL,
    "topic" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "keywords" TEXT[],
    "answer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FAQ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'New chat',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "assistantName" TEXT NOT NULL DEFAULT 'Credit Compass Assistant',
    "welcomeMessage" TEXT NOT NULL,
    "fallbackMessage" TEXT NOT NULL,
    "maxMessageLength" INTEGER NOT NULL DEFAULT 1000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FAQ_question_key" ON "FAQ"("question");

-- CreateIndex
CREATE INDEX "FAQ_topic_idx" ON "FAQ"("topic");

-- CreateIndex
CREATE INDEX "ChatSession_updatedAt_idx" ON "ChatSession"("updatedAt");

-- CreateIndex
CREATE INDEX "Message_sessionId_createdAt_idx" ON "Message"("sessionId", "createdAt");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ChatSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

