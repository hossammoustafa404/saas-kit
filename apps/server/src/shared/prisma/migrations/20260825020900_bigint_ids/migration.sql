-- Existing text IDs cannot be cast to bigint. Auth tables are truncated; re-seed the Admin after migrate.
TRUNCATE TABLE "session", "account", "verification", "user" RESTART IDENTITY CASCADE;

ALTER TABLE "session" DROP CONSTRAINT "session_userId_fkey";
ALTER TABLE "account" DROP CONSTRAINT "account_userId_fkey";

ALTER TABLE "user" DROP CONSTRAINT "user_pkey",
DROP COLUMN "id",
ADD COLUMN "id" BIGSERIAL NOT NULL,
ADD CONSTRAINT "user_pkey" PRIMARY KEY ("id");

ALTER TABLE "session" DROP CONSTRAINT "session_pkey",
DROP COLUMN "id",
ADD COLUMN "id" BIGSERIAL NOT NULL,
ADD CONSTRAINT "session_pkey" PRIMARY KEY ("id");

DROP INDEX IF EXISTS "session_userId_idx";
ALTER TABLE "session" DROP COLUMN "userId",
ADD COLUMN "userId" BIGINT NOT NULL;
ALTER TABLE "session" DROP COLUMN "impersonatedBy",
ADD COLUMN "impersonatedBy" BIGINT;

ALTER TABLE "account" DROP CONSTRAINT "account_pkey",
DROP COLUMN "id",
ADD COLUMN "id" BIGSERIAL NOT NULL,
ADD CONSTRAINT "account_pkey" PRIMARY KEY ("id");

DROP INDEX IF EXISTS "account_userId_idx";
ALTER TABLE "account" DROP COLUMN "userId",
ADD COLUMN "userId" BIGINT NOT NULL;

ALTER TABLE "verification" DROP CONSTRAINT "verification_pkey",
DROP COLUMN "id",
ADD COLUMN "id" BIGSERIAL NOT NULL,
ADD CONSTRAINT "verification_pkey" PRIMARY KEY ("id");

CREATE INDEX "session_userId_idx" ON "session"("userId");
CREATE INDEX "account_userId_idx" ON "account"("userId");

ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
