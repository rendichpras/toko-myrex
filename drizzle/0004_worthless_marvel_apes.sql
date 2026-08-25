CREATE TYPE "public"."product_file_status" AS ENUM('pending', 'ready', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "public"."product_media_role" AS ENUM('cover', 'gallery');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "category" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"summary" varchar(320),
	"description" text,
	"status" "product_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_published_at_required" CHECK ("product"."status" <> 'published' or "product"."published_at" is not null),
	CONSTRAINT "product_archived_at_required" CHECK ("product"."status" <> 'archived' or "product"."archived_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "product_asset" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"storage_key" text NOT NULL,
	"download_name" varchar(255) NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"mime_type" varchar(255) NOT NULL,
	"file_size" bigint NOT NULL,
	"checksum_sha256" char(64),
	"version" integer DEFAULT 1 NOT NULL,
	"status" "product_file_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_asset_file_size_nonnegative" CHECK ("product_asset"."file_size" >= 0),
	CONSTRAINT "product_asset_version_positive" CHECK ("product_asset"."version" > 0),
	CONSTRAINT "product_asset_checksum_format" CHECK ("product_asset"."checksum_sha256" is null or "product_asset"."checksum_sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "product_asset_ready_checksum_required" CHECK ("product_asset"."status" <> 'ready' or "product_asset"."checksum_sha256" is not null)
);
--> statement-breakpoint
CREATE TABLE "product_category" (
	"product_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_category_pk" PRIMARY KEY("product_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "product_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"role" "product_media_role" DEFAULT 'gallery' NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" varchar(255) NOT NULL,
	"file_size" bigint NOT NULL,
	"width" integer,
	"height" integer,
	"alt_text" varchar(500),
	"position" integer DEFAULT 0 NOT NULL,
	"status" "product_file_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_media_file_size_nonnegative" CHECK ("product_media"."file_size" >= 0),
	CONSTRAINT "product_media_width_positive" CHECK ("product_media"."width" is null or "product_media"."width" > 0),
	CONSTRAINT "product_media_height_positive" CHECK ("product_media"."height" is null or "product_media"."height" > 0),
	CONSTRAINT "product_media_position_nonnegative" CHECK ("product_media"."position" >= 0),
	CONSTRAINT "product_media_ready_dimensions_required" CHECK ("product_media"."status" <> 'ready' or ("product_media"."width" is not null and "product_media"."height" is not null))
);
--> statement-breakpoint
CREATE TABLE "product_variant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" uuid NOT NULL,
	"name" varchar(160),
	"sku" varchar(100),
	"price_amount" integer NOT NULL,
	"currency" char(3) DEFAULT 'IDR' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "product_variant_price_amount_nonnegative" CHECK ("product_variant"."price_amount" >= 0),
	CONSTRAINT "product_variant_position_nonnegative" CHECK ("product_variant"."position" >= 0),
	CONSTRAINT "product_variant_currency_idr" CHECK ("product_variant"."currency" = 'IDR')
);
--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_asset" ADD CONSTRAINT "product_asset_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "category_slug_uidx" ON "category" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "category_updated_at_idx" ON "category" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "product_slug_uidx" ON "product" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "product_status_idx" ON "product" USING btree ("status");--> statement-breakpoint
CREATE INDEX "product_updated_at_idx" ON "product" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "product_created_by_idx" ON "product" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "product_updated_by_idx" ON "product" USING btree ("updated_by");--> statement-breakpoint
CREATE UNIQUE INDEX "product_asset_storage_key_uidx" ON "product_asset" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "product_asset_product_id_idx" ON "product_asset" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_asset_product_version_idx" ON "product_asset" USING btree ("product_id","version");--> statement-breakpoint
CREATE INDEX "product_asset_status_idx" ON "product_asset" USING btree ("status");--> statement-breakpoint
CREATE INDEX "product_asset_updated_at_idx" ON "product_asset" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "product_category_product_id_idx" ON "product_category" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_category_category_id_idx" ON "product_category" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_media_storage_key_uidx" ON "product_media" USING btree ("storage_key");--> statement-breakpoint
CREATE UNIQUE INDEX "product_media_current_cover_uidx" ON "product_media" USING btree ("product_id") WHERE "product_media"."role" = 'cover' and "product_media"."status" = 'ready';--> statement-breakpoint
CREATE INDEX "product_media_product_id_idx" ON "product_media" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_media_status_idx" ON "product_media" USING btree ("status");--> statement-breakpoint
CREATE INDEX "product_media_updated_at_idx" ON "product_media" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "product_variant_product_id_idx" ON "product_variant" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_variant_sku_uidx" ON "product_variant" USING btree ("sku") WHERE "product_variant"."sku" is not null;--> statement-breakpoint
CREATE UNIQUE INDEX "product_variant_default_uidx" ON "product_variant" USING btree ("product_id") WHERE "product_variant"."is_default" = true;--> statement-breakpoint
CREATE INDEX "product_variant_updated_at_idx" ON "product_variant" USING btree ("updated_at");