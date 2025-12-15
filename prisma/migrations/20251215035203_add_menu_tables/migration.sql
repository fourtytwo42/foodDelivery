-- CreateTable
CREATE TABLE "MenuCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "availableTimes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "MenuCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItem" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "popular" BOOLEAN NOT NULL DEFAULT false,
    "availableTimes" JSONB,
    "dietaryTags" TEXT[],
    "allergens" TEXT[],
    "calories" INTEGER,
    "nutritionInfo" JSONB,
    "preparationTime" INTEGER,
    "spiceLevel" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "MenuItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Modifier" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "minSelections" INTEGER,
    "maxSelections" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Modifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModifierOption" (
    "id" TEXT NOT NULL,
    "modifierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    "priceType" TEXT NOT NULL DEFAULT 'FIXED',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "ModifierOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MenuItemModifier" (
    "id" TEXT NOT NULL,
    "menuItemId" TEXT NOT NULL,
    "modifierId" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MenuItemModifier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MenuCategory_order_idx" ON "MenuCategory"("order");

-- CreateIndex
CREATE INDEX "MenuCategory_active_idx" ON "MenuCategory"("active");

-- CreateIndex
CREATE INDEX "MenuCategory_deletedAt_idx" ON "MenuCategory"("deletedAt");

-- CreateIndex
CREATE INDEX "MenuItem_categoryId_idx" ON "MenuItem"("categoryId");

-- CreateIndex
CREATE INDEX "MenuItem_active_idx" ON "MenuItem"("active");

-- CreateIndex
CREATE INDEX "MenuItem_featured_idx" ON "MenuItem"("featured");

-- CreateIndex
CREATE INDEX "MenuItem_popular_idx" ON "MenuItem"("popular");

-- CreateIndex
CREATE INDEX "MenuItem_deletedAt_idx" ON "MenuItem"("deletedAt");

-- CreateIndex
CREATE INDEX "Modifier_active_idx" ON "Modifier"("active");

-- CreateIndex
CREATE INDEX "Modifier_deletedAt_idx" ON "Modifier"("deletedAt");

-- CreateIndex
CREATE INDEX "ModifierOption_modifierId_idx" ON "ModifierOption"("modifierId");

-- CreateIndex
CREATE INDEX "ModifierOption_active_idx" ON "ModifierOption"("active");

-- CreateIndex
CREATE INDEX "ModifierOption_order_idx" ON "ModifierOption"("order");

-- CreateIndex
CREATE INDEX "ModifierOption_deletedAt_idx" ON "ModifierOption"("deletedAt");

-- CreateIndex
CREATE INDEX "MenuItemModifier_menuItemId_idx" ON "MenuItemModifier"("menuItemId");

-- CreateIndex
CREATE INDEX "MenuItemModifier_modifierId_idx" ON "MenuItemModifier"("modifierId");

-- CreateIndex
CREATE UNIQUE INDEX "MenuItemModifier_menuItemId_modifierId_key" ON "MenuItemModifier"("menuItemId", "modifierId");

-- AddForeignKey
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "MenuCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModifierOption" ADD CONSTRAINT "ModifierOption_modifierId_fkey" FOREIGN KEY ("modifierId") REFERENCES "Modifier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemModifier" ADD CONSTRAINT "MenuItemModifier_menuItemId_fkey" FOREIGN KEY ("menuItemId") REFERENCES "MenuItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MenuItemModifier" ADD CONSTRAINT "MenuItemModifier_modifierId_fkey" FOREIGN KEY ("modifierId") REFERENCES "Modifier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
