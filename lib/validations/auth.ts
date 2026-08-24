import { z } from "zod"

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email wajib diisi.")
  .pipe(z.email("Masukkan email yang valid."))

const passwordSchema = z
  .string()
  .min(8, "Kata sandi minimal 8 karakter.")
  .max(128, "Kata sandi maksimal 128 karakter.")

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Kata sandi wajib diisi."),
})

export const forgotPasswordSchema = z.object({
  email: emailSchema,
})

export const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Nama lengkap minimal 2 karakter.")
      .max(100, "Nama lengkap maksimal 100 karakter."),
    email: emailSchema,
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Konfirmasi kata sandi tidak cocok.",
    path: ["passwordConfirmation"],
  })

export const resetPasswordSchema = z
  .object({
    token: z.string().trim().min(1, "Tautan atur ulang tidak valid."),
    password: passwordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Konfirmasi kata sandi tidak cocok.",
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
