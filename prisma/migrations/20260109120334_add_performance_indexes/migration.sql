-- CreateIndex
CREATE INDEX "Offer_ownerId_idx" ON "Offer"("ownerId");

-- CreateIndex
CREATE INDEX "Offer_createdAt_idx" ON "Offer"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Offer_expirationDate_idx" ON "Offer"("expirationDate");

-- CreateIndex
CREATE INDEX "Offer_foodType_idx" ON "Offer"("foodType");

-- CreateIndex
CREATE INDEX "Order_userId_idx" ON "Order"("userId");

-- CreateIndex
CREATE INDEX "Order_offerId_idx" ON "Order"("offerId");

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "Rating_providerId_idx" ON "Rating"("providerId");

-- CreateIndex
CREATE INDEX "Rating_userId_idx" ON "Rating"("userId");
