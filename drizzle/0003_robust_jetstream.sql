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
CREATE INDEX "email_delivery_recipient_idx" ON "email_delivery" USING btree ("recipient");--> statement-breakpoint
CREATE INDEX "email_delivery_status_idx" ON "email_delivery" USING btree ("status");--> statement-breakpoint
CREATE INDEX "email_delivery_created_at_idx" ON "email_delivery" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "email_webhook_event_delivery_id_idx" ON "email_webhook_event" USING btree ("delivery_id");--> statement-breakpoint
CREATE INDEX "email_webhook_event_resend_id_idx" ON "email_webhook_event" USING btree ("resend_id");--> statement-breakpoint
CREATE INDEX "email_webhook_event_type_idx" ON "email_webhook_event" USING btree ("type");--> statement-breakpoint
CREATE INDEX "email_webhook_event_occurred_at_idx" ON "email_webhook_event" USING btree ("occurred_at");