import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { nextCookies } from "better-auth/next-js"
import { admin, haveIBeenPwned, twoFactor } from "better-auth/plugins"
import type { NodePgDatabase } from "drizzle-orm/node-postgres"
import {
  APIError,
  createAuthMiddleware,
  getAuthoritativeSessionFromCtx,
} from "better-auth/api"

import { compromisedPasswordMessage } from "@/lib/auth/errors"
import { hasUserRole } from "@/lib/auth/roles"
import * as authSchema from "@/lib/db/schema/auth"

type AuthDatabase = NodePgDatabase<typeof authSchema>

function readAuthSecret() {
  const secret = process.env.BETTER_AUTH_SECRET

  if (!secret || secret.length < 32) {
    throw new Error(
      "BETTER_AUTH_SECRET harus dikonfigurasi dengan minimal 32 karakter."
    )
  }

  return secret
}

function resolveAuthOrigin(request?: Request) {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL
  }

  return request ? new URL(request.url).origin : "http://localhost:3000"
}

function listTrustedAuthOrigins() {
  const origins = new Set<string>()

  if (process.env.BETTER_AUTH_URL) {
    origins.add(process.env.BETTER_AUTH_URL)
  }

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3000")
  }

  return [...origins]
}

function buildAuthEmailHtml({
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

export const createAuth = (database: AuthDatabase) => betterAuth({
  appName: "Toko Myrex",
  secret: readAuthSecret(),
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  trustedOrigins: listTrustedAuthOrigins(),
  database: drizzleAdapter(database, {
    provider: "pg",
    schema: authSchema,
  }),
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "user",
        input: false,
      },
      banned: {
        type: "boolean",
        required: true,
        defaultValue: false,
        input: false,
      },
      twoFactorEnabled: {
        type: "boolean",
        required: true,
        defaultValue: false,
        input: false,
      },
    },
  },
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
      twoFactorEnabled: false,
      ...additionalFields,
      id,
    }),
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const { queueAuthEmail } = await import("@/lib/email/delivery")

      queueAuthEmail({
        category: "password_reset",
        to: user.email,
        subject: "Atur ulang kata sandi Toko Myrex",
        text: `Buat kata sandi baru untuk akun Toko Myrex melalui tautan berikut:\n${url}\n\nAbaikan email ini jika Anda tidak meminta tautan tersebut.`,
        html: buildAuthEmailHtml({
          description: "Buat kata sandi baru untuk akun Toko Myrex.",
          label: "Buat kata sandi baru",
          notice:
            "Abaikan email ini jika Anda tidak meminta tautan tersebut.",
          url,
        }),
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: true,
    sendVerificationEmail: async ({ user, token }, request) => {
      const { queueAuthEmail } = await import("@/lib/email/delivery")

      const url = new URL("/verifikasi-email", resolveAuthOrigin(request))
      url.searchParams.set("token", token)

      queueAuthEmail({
        category: "email_verification",
        to: user.email,
        subject: "Verifikasi email Toko Myrex",
        text: `Verifikasi alamat email Anda untuk mengaktifkan akun Toko Myrex:\n${url}\n\nAbaikan email ini jika Anda tidak membuat akun atau mencoba masuk.`,
        html: buildAuthEmailHtml({
          description: "Verifikasi alamat email Anda untuk mengaktifkan akun Toko Myrex.",
          label: "Verifikasi email",
          notice:
            "Abaikan email ini jika Anda tidak membuat akun atau mencoba masuk.",
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
  hooks: {
    before: createAuthMiddleware(async (context) => {
      if (
        !context.path.startsWith("/admin/") ||
        context.path === "/admin/has-permission" ||
        context.path === "/admin/stop-impersonating"
      ) {
        return
      }

      const session = await getAuthoritativeSessionFromCtx(context)

      if (!session) {
        return
      }

      if (
        hasUserRole(session.user.role, "admin") &&
        !session.user.twoFactorEnabled
      ) {
        throw new APIError("FORBIDDEN", {
          code: "TWO_FACTOR_REQUIRED",
          message:
            "Aktifkan verifikasi dua langkah untuk mengakses fitur admin.",
        })
      }
    }),
  },
  plugins: [
    haveIBeenPwned({
      customPasswordCompromisedMessage: compromisedPasswordMessage,
    }),
    admin({
      defaultRole: "user",
      adminRoles: ["admin"],
    }),
    twoFactor({
      issuer: "Toko Myrex",
      backupCodeOptions: {
        storeBackupCodes: "encrypted",
      },
    }),
    nextCookies(),
  ],
})
