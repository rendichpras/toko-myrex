import { z } from "zod"

const emailSchema = z
  .string()
  .trim()
  .min(1, "Masukkan email.")
  .pipe(z.email("Masukkan email yang valid."))

const passwordSchema = z
  .string()
  .min(8, "Gunakan minimal 8 karakter.")
  .max(128, "Gunakan maksimal 128 karakter.")

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
      .min(2, "Gunakan minimal 2 karakter.")
      .max(100, "Gunakan maksimal 100 karakter."),
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
