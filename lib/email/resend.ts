import "server-only"

import { Resend } from "resend"

let resendClient: Resend | undefined

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error("RESEND_API_KEY belum dikonfigurasi.")
  }

  resendClient ??= new Resend(apiKey)

  return resendClient
}

export function getResendWebhookSecret() {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET

  if (!webhookSecret) {
    throw new Error("RESEND_WEBHOOK_SECRET belum dikonfigurasi.")
  }

  return webhookSecret
}
