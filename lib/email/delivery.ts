import "server-only"

import { randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"

import { db } from "@/lib/db"
import { emailDelivery } from "@/lib/db/schema/index"
import { getResendClient } from "@/lib/email/resend"

export type AuthEmailCategory = "email_verification" | "password_reset"

type AuthEmail = {
  category: AuthEmailCategory
  to: string
  subject: string
  text: string
  html: string
}

function summarizeDeliveryError(error: unknown) {
  const message = error instanceof Error ? error.message : "Kesalahan tidak diketahui."

  return message.slice(0, 1_000)
}

export async function sendAuthEmail(email: AuthEmail) {
  const from = process.env.EMAIL_FROM

  if (!from) {
    throw new Error("EMAIL_FROM belum dikonfigurasi.")
  }

  const deliveryId = randomUUID()
  const { category, to, ...content } = email

  await db.insert(emailDelivery).values({
    id: deliveryId,
    recipient: to,
    category,
  })

  let resendId: string

  try {
    const { data: acceptedEmail, error } = await getResendClient().emails.send(
      {
        from,
        to,
        ...content,
        tags: [
          { name: "category", value: category },
          { name: "delivery_id", value: deliveryId },
        ],
      },
      { idempotencyKey: deliveryId }
    )

    if (error) {
      throw new Error(`Resend menolak pengiriman: ${error.message}`)
    }

    if (!acceptedEmail) {
      throw new Error("Resend tidak mengembalikan ID pengiriman.")
    }

    resendId = acceptedEmail.id
  } catch (error) {
    const detail = summarizeDeliveryError(error)

    try {
      await db
        .update(emailDelivery)
        .set({
          status: "send_failed",
          detail,
          lastEventAt: new Date(),
        })
        .where(
          and(
            eq(emailDelivery.id, deliveryId),
            eq(emailDelivery.status, "queued")
          )
        )
    } catch (persistenceError) {
      console.error("Gagal merekam kegagalan pengiriman email.", {
        deliveryId,
        error: persistenceError,
      })
    }

    throw error
  }

  try {
    await db
      .update(emailDelivery)
      .set({
        resendId,
        status: "accepted",
        detail: null,
        lastEventAt: new Date(),
      })
      .where(
        and(
          eq(emailDelivery.id, deliveryId),
          eq(emailDelivery.status, "queued")
        )
      )
  } catch (error) {
    console.error("Gagal merekam email yang diterima Resend.", {
      deliveryId,
      resendId,
      error,
    })
  }
}
