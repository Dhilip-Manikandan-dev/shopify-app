-- CreateEnum
CREATE TYPE "RuleStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('SHIPPING', 'DISCOUNT', 'UPSELL');

-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('RULE_TRIGGERED', 'UPSELL_VIEWED', 'UPSELL_CLICKED', 'UPSELL_ADDED');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('FREE', 'STARTER', 'GROWTH');

-- CreateTable
CREATE TABLE "Store" (
    "id" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "name" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "country" TEXT NOT NULL DEFAULT 'IN',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    "domesticCountry" TEXT NOT NULL DEFAULT 'IN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uninstalledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Store_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopifyCredential" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "accessTokenEncrypted" TEXT NOT NULL,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenEncrypted" TEXT,
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "reauthRequired" BOOLEAN NOT NULL DEFAULT false,
    "refreshLockUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifyCredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "RuleStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" INTEGER NOT NULL DEFAULT 10,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleGroup" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "RuleGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Condition" (
    "id" TEXT NOT NULL,
    "ruleGroupId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "valueType" TEXT NOT NULL DEFAULT 'string',
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Condition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "type" "ActionType" NOT NULL,
    "configuration" JSONB NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Upsell" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "variantId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "originalPrice" DECIMAL(10,2) NOT NULL,
    "offerPrice" DECIMAL(10,2) NOT NULL,
    "discountType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "discountValue" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "buttonText" TEXT NOT NULL DEFAULT 'Add to Cart',
    "maxProducts" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "excludeIfInCart" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Upsell_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RuleDisplay" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT NOT NULL,
    "productPage" BOOLEAN NOT NULL DEFAULT true,
    "collectionPage" BOOLEAN NOT NULL DEFAULT true,
    "cartPage" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "RuleDisplay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExecutionLog" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "ruleId" TEXT,
    "contextHash" TEXT NOT NULL,
    "matched" BOOLEAN NOT NULL,
    "surface" TEXT,
    "diagnostics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "ruleId" TEXT,
    "eventType" "AnalyticsEventType" NOT NULL,
    "productId" TEXT,
    "variantId" TEXT,
    "surface" TEXT,
    "sessionId" TEXT,
    "idempotencyKey" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "plan" "PlanTier" NOT NULL DEFAULT 'FREE',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "shopifyChargeId" TEXT,
    "currentPeriodEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessedWebhook" (
    "id" TEXT NOT NULL,
    "webhookId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "shop" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProcessedWebhook_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Store_shop_key" ON "Store"("shop");

-- CreateIndex
CREATE INDEX "Store_shop_idx" ON "Store"("shop");

-- CreateIndex
CREATE UNIQUE INDEX "ShopifyCredential_storeId_key" ON "ShopifyCredential"("storeId");

-- CreateIndex
CREATE INDEX "ShopifyCredential_shop_idx" ON "ShopifyCredential"("shop");

-- CreateIndex
CREATE INDEX "Rule_storeId_status_priority_idx" ON "Rule"("storeId", "status", "priority");

-- CreateIndex
CREATE INDEX "RuleGroup_ruleId_position_idx" ON "RuleGroup"("ruleId", "position");

-- CreateIndex
CREATE INDEX "Condition_ruleGroupId_position_idx" ON "Condition"("ruleGroupId", "position");

-- CreateIndex
CREATE INDEX "Action_ruleId_position_idx" ON "Action"("ruleId", "position");

-- CreateIndex
CREATE INDEX "Upsell_ruleId_enabled_idx" ON "Upsell"("ruleId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "RuleDisplay_ruleId_key" ON "RuleDisplay"("ruleId");

-- CreateIndex
CREATE INDEX "ExecutionLog_storeId_createdAt_idx" ON "ExecutionLog"("storeId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsEvent_idempotencyKey_key" ON "AnalyticsEvent"("idempotencyKey");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_storeId_eventType_createdAt_idx" ON "AnalyticsEvent"("storeId", "eventType", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_storeId_key" ON "Subscription"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessedWebhook_webhookId_key" ON "ProcessedWebhook"("webhookId");

-- CreateIndex
CREATE INDEX "ProcessedWebhook_webhookId_idx" ON "ProcessedWebhook"("webhookId");

-- AddForeignKey
ALTER TABLE "ShopifyCredential" ADD CONSTRAINT "ShopifyCredential_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rule" ADD CONSTRAINT "Rule_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleGroup" ADD CONSTRAINT "RuleGroup_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Condition" ADD CONSTRAINT "Condition_ruleGroupId_fkey" FOREIGN KEY ("ruleGroupId") REFERENCES "RuleGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Upsell" ADD CONSTRAINT "Upsell_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RuleDisplay" ADD CONSTRAINT "RuleDisplay_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionLog" ADD CONSTRAINT "ExecutionLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExecutionLog" ADD CONSTRAINT "ExecutionLog_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsEvent" ADD CONSTRAINT "AnalyticsEvent_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
