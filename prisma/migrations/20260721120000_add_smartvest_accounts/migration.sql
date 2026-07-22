-- Additive SmartVest simulation metadata. Existing wallet balances remain the source of truth.
CREATE TABLE "smartvest_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'balanced',
    "allocation" JSONB NOT NULL,
    "disclaimer_acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,
    CONSTRAINT "smartvest_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "smartvest_accounts_user_id_unique" ON "smartvest_accounts"("user_id");
