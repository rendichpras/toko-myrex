import { z } from "zod"

export const AUTH_NAME_MIN_LENGTH = 2
export const AUTH_NAME_MAX_LENGTH = 100
export const AUTH_PASSWORD_MIN_LENGTH = 8
export const AUTH_PASSWORD_MAX_LENGTH = 128

const emailSchema = z
  .string()
  .trim()
  .min(1, "Masukkan email.")
  .pipe(z.email("Masukkan email yang valid."))

const passwordSchema = z
  .string()
  .min(
    AUTH_PASSWORD_MIN_LENGTH,
    `Gunakan minimal ${AUTH_PASSWORD_MIN_LENGTH} karakter.`
  )
  .max(
    AUTH_PASSWORD_MAX_LENGTH,
    `Gunakan maksimal ${AUTH_PASSWORD_MAX_LENGTH} karakter.`
  )

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Masukkan kata sandi."),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Masukkan nama lengkap.")
      .min(
        AUTH_NAME_MIN_LENGTH,
        `Gunakan minimal ${AUTH_NAME_MIN_LENGTH} karakter.`
      )
      .max(
        AUTH_NAME_MAX_LENGTH,
        `Gunakan maksimal ${AUTH_NAME_MAX_LENGTH} karakter.`
      ),
    email: emailSchema,
    password: passwordSchema,
    passwordConfirmation: z.string().min(1, "Ulangi kata sandi."),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Kata sandi tidak cocok.",
    path: ["passwordConfirmation"],
  })

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "Minta tautan pengaturan ulang baru."),
    password: passwordSchema,
    passwordConfirmation: z.string().min(1, "Ulangi kata sandi."),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Kata sandi tidak cocok.",
    path: ["passwordConfirmation"],
  })

export type AuthField =
  | "name"
  | "email"
  | "password"
  | "passwordConfirmation"
  | "token"

export type AuthFormState = {
  errors?: Partial<Record<AuthField, string[]>>
}
