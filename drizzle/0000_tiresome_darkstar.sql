CREATE TYPE "public"."product_file_status" AS ENUM('pending', 'ready', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "public"."product_media_role" AS ENUM('cover', 'gallery');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"issuer" text NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "rate_limit_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"impersonated_by" text,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL,
	"verified" boolean DEFAULT true,
	"failed_verification_count" integer DEFAULT 0,
	"locked_until" timestamp
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"role" text DEFAULT 'user' NOT NULL,
	"banned" boolean DEFAULT false NOT NULL,
	"ban_reason" text,
	"ban_expires" timestamp,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
	"rejection_reason" varchar(500),
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
	"rejection_reason" varchar(500),
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
CREATE TABLE "email_delivery" (
	"id" text PRIMARY KEY NOT NULL,
	"resend_id" text,
	"recipient" text NOT NULL,
	"category" text NOT NULL,
	"status" text DEFAULT 'queued' NOT NULL,
	"detail" text,
	"last_event_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "email_delivery_resend_id_unique" UNIQUE("resend_id")
);
--> statement-breakpoint
CREATE TABLE "email_webhook_event" (
	"id" text PRIMARY KEY NOT NULL,
	"delivery_id" text NOT NULL,
	"resend_id" text NOT NULL,
	"type" text NOT NULL,
	"detail" text,
	"occurred_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_asset" ADD CONSTRAINT "product_asset_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_category" ADD CONSTRAINT "product_category_category_id_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_media" ADD CONSTRAINT "product_media_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_variant" ADD CONSTRAINT "product_variant_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "account_issuer_accountId_uidx" ON "account" USING btree ("issuer","account_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "twoFactor_secret_idx" ON "two_factor" USING btree ("secret");--> statement-breakpoint
CREATE INDEX "twoFactor_userId_idx" ON "two_factor" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "category_slug_uidx" ON "category" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "category_updated_at_idx" ON "category" USING btree ("updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "product_slug_uidx" ON "product" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "product_status_idx" ON "product" USING btree ("status");--> statement-breakpoint
CREATE INDEX "product_updated_at_idx" ON "product" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "product_created_by_idx" ON "product" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "product_updated_by_idx" ON "product" USING btree ("updated_by");--> statement-breakpoint
CREATE UNIQUE INDEX "product_asset_storage_key_uidx" ON "product_asset" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "product_asset_product_id_idx" ON "product_asset" USING btree ("product_id");--> statement-breakpoint
CREATE UNIQUE INDEX "product_asset_product_version_uidx" ON "product_asset" USING btree ("product_id","version");--> statement-breakpoint
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
CREATE INDEX "product_variant_updated_at_idx" ON "product_variant" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "email_delivery_recipient_idx" ON "email_delivery" USING btree ("recipient");--> statement-breakpoint
CREATE INDEX "email_delivery_status_idx" ON "email_delivery" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_delivery_created_at_idx" ON "email_delivery" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_webhook_event_delivery_id_idx" ON "email_webhook_event" USING btree ("delivery_id");--> statement-breakpoint
CREATE INDEX "email_webhook_event_resend_id_idx" ON "email_webhook_event" USING btree ("resend_id");--> statement-breakpoint
CREATE INDEX "email_webhook_event_type_idx" ON "email_webhook_event" USING btree ("type");--> statement-breakpoint
CREATE INDEX "email_webhook_event_occurred_at_idx" ON "email_webhook_event" USING btree ("occurred_at");