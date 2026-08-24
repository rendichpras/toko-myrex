import { Resend } from "resend"
import { after } from "next/server"

type AuthEmail = {
  to: string
  subject: string
  text: string
  html: string
}

function getEmailClient() {
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    throw new Error("RESEND_API_KEY belum dikonfigurasi.")
  }

  return new Resend(apiKey)
}

export async function sendAuthEmail(email: AuthEmail) {
  const from = process.env.EMAIL_FROM

  if (!from) {
    throw new Error("EMAIL_FROM belum dikonfigurasi.")
  }

  const { error } = await getEmailClient().emails.send({
    from,
    ...email,
  })

  if (error) {
    throw new Error(`Gagal mengirim email auth: ${error.message}`)
  }
}

export function queueAuthEmail(email: AuthEmail) {
  after(async () => {
    try {
      await sendAuthEmail(email)
    } catch (error) {
      console.error("Pengiriman email auth gagal.", error)
    }
  })
}
