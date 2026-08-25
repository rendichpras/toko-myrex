import type { WebhookEventPayload } from "resend"

import {
  isEmailDeliveryProblem,
  isTrackedEmailEvent,
  recordResendEmailEvent,
} from "@/lib/email/webhook"
import {
  getResendClient,
  getResendWebhookSecret,
} from "@/lib/email/resend"

function rejectInvalidWebhook() {
  return new Response("Webhook tidak valid.", { status: 400 })
}

export async function POST(request: Request) {
  const eventId = request.headers.get("svix-id")
  const timestamp = request.headers.get("svix-timestamp")
  const signature = request.headers.get("svix-signature")

  if (!eventId || !timestamp || !signature) {
    return rejectInvalidWebhook()
  }

  let webhookSecret: string
  let resendClient: ReturnType<typeof getResendClient>

  try {
    webhookSecret = getResendWebhookSecret()
    resendClient = getResendClient()
  } catch (error) {
    console.error("Konfigurasi webhook Resend belum lengkap.", error)
    return new Response("Webhook belum dikonfigurasi.", { status: 500 })
  }

  let event: WebhookEventPayload

  try {
    const payload = await request.text()
    event = resendClient.webhooks.verify({
      payload,
      headers: {
        id: eventId,
        timestamp,
        signature,
      },
      webhookSecret,
    })
  } catch {
    return rejectInvalidWebhook()
  }

  if (!isTrackedEmailEvent(event)) {
    return Response.json({ received: true })
  }

  try {
    const wasRecorded = await recordResendEmailEvent(eventId, event)

    if (wasRecorded && isEmailDeliveryProblem(event)) {
      console.error("Resend melaporkan masalah pengiriman email.", {
        eventId,
        emailId: event.data.email_id,
        type: event.type,
      })
    }

    return Response.json({ received: true })
  } catch (error) {
    console.error("Gagal merekam webhook Resend.", {
      eventId,
      emailId: event.data.email_id,
      type: event.type,
      error,
    })

    return new Response("Webhook belum dapat diproses.", { status: 500 })
  }
}
