import { z } from "zod"

export const totpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "Masukkan 6 digit dari aplikasi autentikator.")

export const backupCodeSchema = z
  .string()
  .trim()
  .min(1, "Masukkan kode cadangan.")
