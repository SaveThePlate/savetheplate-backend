-- Enable Row Level Security (RLS) without deleting data
-- This migration is safe for existing rows.

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Offer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContactMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Rating" ENABLE ROW LEVEL SECURITY;

-- Temporary permissive policies to avoid breaking existing app behavior.
-- Replace with stricter policies in a follow-up migration.

DROP POLICY IF EXISTS "User_allow_all_tmp" ON "User";
CREATE POLICY "User_allow_all_tmp"
ON "User"
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Offer_allow_all_tmp" ON "Offer";
CREATE POLICY "Offer_allow_all_tmp"
ON "Offer"
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Order_allow_all_tmp" ON "Order";
CREATE POLICY "Order_allow_all_tmp"
ON "Order"
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "ContactMessage_allow_all_tmp" ON "ContactMessage";
CREATE POLICY "ContactMessage_allow_all_tmp"
ON "ContactMessage"
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Rating_allow_all_tmp" ON "Rating";
CREATE POLICY "Rating_allow_all_tmp"
ON "Rating"
FOR ALL
USING (true)
WITH CHECK (true);
