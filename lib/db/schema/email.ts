import { index, pgTable, text, timestamp } from "drizzle-orm/pg-core"

export const emailDelivery = pgTable(
  "email_delivery",
  {
    id: text("id").primaryKey(),
    resendId: text("resend_id").unique(),
    recipient: text("recipient").notNull(),
    category: text("category").notNull(),
    status: text("status").default("queued").notNull(),
    detail: text("detail"),
    lastEventAt: timestamp("last_event_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("email_delivery_recipient_idx").on(table.recipient),
    index("email_delivery_status_idx").on(table.status),
    index("email_delivery_created_at_idx").on(table.createdAt),
  ]
)

export const emailWebhookEvent = pgTable(
  "email_webhook_event",
  {
    id: text("id").primaryKey(),
    deliveryId: text("delivery_id").notNull(),
    resendId: text("resend_id").notNull(),
    type: text("type").notNull(),
    detail: text("detail"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("email_webhook_event_delivery_id_idx").on(table.deliveryId),
    index("email_webhook_event_resend_id_idx").on(table.resendId),
    index("email_webhook_event_type_idx").on(table.type),
    index("email_webhook_event_occurred_at_idx").on(table.occurredAt),
  ]
)
