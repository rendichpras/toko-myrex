import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { admin } from "better-auth/plugins"

import { db } from "@/lib/db"
import * as schema from "@/lib/db/schema"
import { queueAuthEmail } from "@/lib/email"

const buildFallbackSecret =
  "toko-myrex-build-only-secret-that-cannot-be-used-at-runtime"

function getOrigin(request?: Request) {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL
  }

  return request ? new URL(request.url).origin : "http://localhost:3000"
}

function getTrustedOrigins() {
  const origins = new Set<string>()

  if (process.env.BETTER_AUTH_URL) {
    origins.add(process.env.BETTER_AUTH_URL)
  }

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000")
  }

  return [...origins]
}

function emailActionHtml({
  description,
  label,
  notice,
  url,
}: {
  description: string
  label: string
  notice: string
  url: string
}) {
  const safeUrl = url
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")

  return `<p>${description}</p><p><a href="${safeUrl}">${label}</a></p><p>${notice}</p>`
}

export const auth = betterAuth({
  appName: "Toko Myrex",
  secret: process.env.BETTER_AUTH_SECRET ?? buildFallbackSecret,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  trustedOrigins: getTrustedOrigins(),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: true,
    customSyntheticUser: ({ coreFields, additionalFields, id }) => ({
      ...coreFields,
      role: "user",
      banned: false,
      banReason: null,
      banExpires: null,
      ...additionalFields,
      id,
    }),
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      queueAuthEmail({
        to: user.email,
        subject: "Atur ulang kata sandi Toko Myrex",
        text: `Gunakan tautan berikut untuk mengatur ulang kata sandi akun Toko Myrex: ${url}\n\nAbaikan email ini jika kamu tidak meminta perubahan kata sandi.`,
        html: emailActionHtml({
          description:
            "Gunakan tautan berikut untuk mengatur ulang kata sandi akun Toko Myrex.",
          label: "Atur ulang kata sandi",
          notice:
            "Abaikan email ini jika kamu tidak meminta perubahan kata sandi.",
          url,
        }),
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, token }, request) => {
      const url = new URL("/verifikasi-email", getOrigin(request))
      url.searchParams.set("token", token)

      queueAuthEmail({
        to: user.email,
        subject: "Verifikasi email Toko Myrex",
        text: `Gunakan tautan berikut untuk memverifikasi email akun Toko Myrex: ${url}\n\nAbaikan email ini jika kamu tidak membuat atau mencoba masuk ke akun Toko Myrex.`,
        html: emailActionHtml({
          description:
            "Gunakan tautan berikut untuk memverifikasi email akun Toko Myrex.",
          label: "Verifikasi email",
          notice:
            "Abaikan email ini jika kamu tidak membuat atau mencoba masuk ke akun Toko Myrex.",
          url: url.toString(),
        }),
      })
    },
  },
  rateLimit: {
    storage: "database",
  },
  advanced: {
    database: {
      joins: true,
    },
  },
  plugins: [
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    nextCookies(),
  ],
})
