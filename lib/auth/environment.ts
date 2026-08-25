import "server-only"

import { z } from "zod"

const authEnvironmentSchema = z.object({
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  DATABASE_URL: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().min(1),
})

export function assertAuthEnvironment() {
  const validation = authEnvironmentSchema.safeParse({
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    EMAIL_FROM: process.env.EMAIL_FROM,
  })

  if (!validation.success) {
    const invalidVariables = validation.error.issues
      .map((issue) => issue.path[0])
      .filter((name): name is string => typeof name === "string")

    throw new Error(
      `Konfigurasi auth belum lengkap atau tidak valid: ${[
        ...new Set(invalidVariables),
      ].join(", ")}`
    )
  }
}
