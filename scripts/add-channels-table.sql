-- Add sale_channels table if it doesn't exist
CREATE TABLE IF NOT EXISTS "sale_channels" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Add channel_id column to sales table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'sales' AND column_name = 'channel_id'
    ) THEN
        ALTER TABLE "sales" ADD COLUMN "channel_id" varchar(255);
    END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'sales_channel_id_sale_channels_id_fk'
    ) THEN
        ALTER TABLE "sales" ADD CONSTRAINT "sales_channel_id_sale_channels_id_fk"
        FOREIGN KEY ("channel_id") REFERENCES "sale_channels"("id") ON DELETE SET NULL;
    END IF;
END $$;
