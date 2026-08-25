import "server-only"

import { lte } from "drizzle-orm"
import type { WebhookEventPayload } from "resend"

import { db } from "@/lib/db"
import {
  emailDelivery,
  emailWebhookEvent,
} from "@/lib/db/schema/index"

const trackedEmailEventTypes = [
  "email.sent",
  "email.delivered",
  "email.delivery_delayed",
  "email.complained",
  "email.bounced",
  "email.failed",
  "email.suppressed",
] as const

type TrackedEmailEventType = (typeof trackedEmailEventTypes)[number]
export type TrackedEmailEvent = Extract<
  WebhookEventPayload,
  { type: TrackedEmailEventType }
>

export function isTrackedEmailEvent(
  event: WebhookEventPayload
): event is TrackedEmailEvent {
  return trackedEmailEventTypes.some((type) => type === event.type)
}

export function isEmailDeliveryProblem(event: TrackedEmailEvent) {
  return (
    event.type === "email.delivery_delayed" ||
    event.type === "email.complained" ||
    event.type === "email.bounced" ||
    event.type === "email.failed" ||
    event.type === "email.suppressed"
  )
}

function getEventDetail(event: TrackedEmailEvent) {
  switch (event.type) {
    case "email.bounced":
      return event.data.bounce.message.slice(0, 1_000)
    case "email.failed":
      return event.data.failed.reason.slice(0, 1_000)
    case "email.suppressed":
      return event.data.suppressed.message.slice(0, 1_000)
    default:
      return null
  }
}

export async function recordResendEmailEvent(
  eventId: string,
  event: TrackedEmailEvent
) {
  const occurredAt = new Date(event.created_at)

  if (Number.isNaN(occurredAt.getTime())) {
    throw new Error("Timestamp webhook Resend tidak valid.")
  }

  const resendId = event.data.email_id
  const deliveryId = event.data.tags?.delivery_id ?? resendId
  const category = event.data.tags?.category ?? "unknown"
  const recipient = event.data.to[0] ?? "unknown"
  const detail = getEventDetail(event)
  const receivedAt = new Date()

  return db.transaction(async (transaction) => {
    const [insertedEvent] = await transaction
      .insert(emailWebhookEvent)
      .values({
        id: eventId,
        deliveryId,
        resendId,
        type: event.type,
        detail,
        occurredAt,
      })
      .onConflictDoNothing()
      .returning({ id: emailWebhookEvent.id })

    if (!insertedEvent) {
      return false
    }

    await transaction
      .insert(emailDelivery)
      .values({
        id: deliveryId,
        resendId,
        recipient,
        category,
        status: event.type,
        detail,
        lastEventAt: occurredAt,
        updatedAt: receivedAt,
      })
      .onConflictDoUpdate({
        target: emailDelivery.id,
        set: {
          resendId,
          status: event.type,
          detail,
          lastEventAt: occurredAt,
          updatedAt: receivedAt,
        },
        setWhere: lte(emailDelivery.lastEventAt, occurredAt),
      })

    return true
  })
}
