import { z } from "zod"

import { PRODUCT_ASSET_MIME_TYPES } from "@/lib/storage/file-policy"

const storageEnvironmentSchema = z
  .object({
    R2_ACCOUNT_ID: z.string().trim().min(1),
    R2_ACCESS_KEY_ID: z.string().trim().min(1),
    R2_SECRET_ACCESS_KEY: z.string().trim().min(1),
    R2_MEDIA_BUCKET: z.string().trim().min(1),
    R2_PRIVATE_BUCKET: z.string().trim().min(1),
    R2_MEDIA_PUBLIC_URL: z
      .url()
      .refine((value) => new URL(value).protocol === "https:"),
    R2_UPLOAD_EXPIRES_SECONDS: z.coerce.number().int().min(60).max(900),
    PRODUCT_ASSET_MAX_BYTES: z.coerce
      .number()
      .int()
      .min(1)
      .max(5 * 1024 * 1024 * 1024),
    PRODUCT_ASSET_ALLOWED_MIME_TYPES: z.string().trim().min(1),
  })
  .superRefine((value, context) => {
    if (value.R2_MEDIA_BUCKET === value.R2_PRIVATE_BUCKET) {
      context.addIssue({
        code: "custom",
        message: "Bucket media dan privat harus berbeda.",
        path: ["R2_PRIVATE_BUCKET"],
      })
    }

    const supportedMimeTypes = new Set<string>(PRODUCT_ASSET_MIME_TYPES)
    const configuredMimeTypes = value.PRODUCT_ASSET_ALLOWED_MIME_TYPES.split(",")
      .map((mimeType) => mimeType.trim().toLowerCase())
      .filter(Boolean)

    if (
      configuredMimeTypes.length === 0 ||
      configuredMimeTypes.some((mimeType) => !supportedMimeTypes.has(mimeType))
    ) {
      context.addIssue({
        code: "custom",
        message: "Jenis file produk yang dikonfigurasi belum didukung.",
        path: ["PRODUCT_ASSET_ALLOWED_MIME_TYPES"],
      })
    }
  })

const publicMediaUrlSchema = z
  .url()
  .refine((value) => new URL(value).protocol === "https:")

export function parseStorageEnvironment(input: unknown) {
  return storageEnvironmentSchema.safeParse(input)
}

export function parsePublicMediaUrl(input: unknown) {
  return publicMediaUrlSchema.safeParse(input)
}
