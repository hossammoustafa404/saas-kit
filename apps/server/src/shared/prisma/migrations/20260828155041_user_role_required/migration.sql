-- AlterTable
UPDATE "user" SET "role" = 'customer' WHERE "role" IS NULL;

ALTER TABLE "user" ALTER COLUMN "role" SET NOT NULL,
ALTER COLUMN "role" SET DEFAULT 'customer';
