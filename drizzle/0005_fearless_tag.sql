DROP INDEX "product_asset_product_version_idx";--> statement-breakpoint
ALTER TABLE "product_asset" ADD COLUMN "rejection_reason" varchar(500);--> statement-breakpoint
ALTER TABLE "product_media" ADD COLUMN "rejection_reason" varchar(500);--> statement-breakpoint
CREATE UNIQUE INDEX "product_asset_product_version_uidx" ON "product_asset" USING btree ("product_id","version");