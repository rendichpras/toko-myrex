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

function readAuthBaseUrl() {
  const configuredUrl = process.env.BETTER_AUTH_URL

  if (!configuredUrl) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("BETTER_AUTH_URL harus dikonfigurasi di production.")
    }

    return "http://localhost:3000"
  }

  let url: URL

  try {
    url = new URL(configuredUrl)
  } catch {
    throw new Error("BETTER_AUTH_URL harus berupa URL yang valid.")
  }

  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("BETTER_AUTH_URL harus menggunakan HTTPS di production.")
  }

  return url.origin
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

export const createAuth = (database: AuthDatabase) => {
  const baseURL = readAuthBaseUrl()

  return betterAuth({
    appName: "Produk Digital",
    secret: readAuthSecret(),
    baseURL,
    trustedOrigins: [baseURL],
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
        const { sendAuthEmail } = await import("@/lib/email/delivery")

        await sendAuthEmail({
          category: "password_reset",
          to: user.email,
          subject: "Atur ulang kata sandi",
          text: `Buat kata sandi baru untuk akun Anda melalui tautan berikut:\n${url}\n\nAbaikan email ini jika Anda tidak meminta tautan tersebut.`,
          html: buildAuthEmailHtml({
            description: "Buat kata sandi baru untuk akun Anda.",
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
      sendVerificationEmail: async ({ user, token }) => {
        const { sendAuthEmail } = await import("@/lib/email/delivery")

        const url = new URL("/verifikasi-email", baseURL)
        url.searchParams.set("token", token)

        await sendAuthEmail({
          category: "email_verification",
          to: user.email,
          subject: "Verifikasi alamat email",
          text: `Verifikasi alamat email Anda untuk mengaktifkan akun:\n${url}\n\nAbaikan email ini jika Anda tidak membuat akun atau mencoba masuk.`,
          html: buildAuthEmailHtml({
            description: "Verifikasi alamat email Anda untuk mengaktifkan akun.",
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
        issuer: "Produk Digital",
        backupCodeOptions: {
          storeBackupCodes: "encrypted",
        },
      }),
      nextCookies(),
    ],
  })
}
