import { describe, expect, test } from "bun:test"

import {
  AUTH_NAME_MAX_LENGTH,
  AUTH_NAME_MIN_LENGTH,
  AUTH_PASSWORD_MAX_LENGTH,
  AUTH_PASSWORD_MIN_LENGTH,
  resetPasswordSchema,
  signUpSchema,
} from "@/lib/auth/validation/credentials"

describe("validasi kredensial auth", () => {
  test("menerima batas nama dan kata sandi yang dikonfigurasi", () => {
    const parsed = signUpSchema.safeParse({
      name: "A".repeat(AUTH_NAME_MIN_LENGTH),
      email: " user@example.com ",
      password: "x".repeat(AUTH_PASSWORD_MIN_LENGTH),
      passwordConfirmation: "x".repeat(AUTH_PASSWORD_MIN_LENGTH),
    })

    expect(parsed.success).toBe(true)

    if (parsed.success) {
      expect(parsed.data.email).toBe("user@example.com")
    }
  })

  test("menolak nilai di luar batas maksimum", () => {
    const parsed = signUpSchema.safeParse({
      name: "A".repeat(AUTH_NAME_MAX_LENGTH + 1),
      email: "user@example.com",
      password: "x".repeat(AUTH_PASSWORD_MAX_LENGTH + 1),
      passwordConfirmation: "x".repeat(AUTH_PASSWORD_MAX_LENGTH + 1),
    })

    expect(parsed.success).toBe(false)
  })

  test("menolak kata sandi yang terlalu pendek", () => {
    const password = "x".repeat(AUTH_PASSWORD_MIN_LENGTH - 1)
    const parsed = signUpSchema.safeParse({
      name: "User",
      email: "user@example.com",
      password,
      passwordConfirmation: password,
    })

    expect(parsed.success).toBe(false)
  })

  test("menolak konfirmasi kata sandi yang berbeda saat reset", () => {
    const parsed = resetPasswordSchema.safeParse({
      token: "token-valid",
      password: "x".repeat(AUTH_PASSWORD_MIN_LENGTH),
      passwordConfirmation: "y".repeat(AUTH_PASSWORD_MIN_LENGTH),
    })

    expect(parsed.success).toBe(false)
    expect(
      parsed.error?.flatten().fieldErrors.passwordConfirmation?.[0]
    ).toBe("Kata sandi tidak cocok.")
  })
})
