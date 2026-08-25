import { z } from "zod"

import { formatBytes } from "@/lib/format"
import { getStorageConfig } from "@/lib/storage/config"
import {
  ALLOWED_EXTENSIONS_BY_MIME_TYPE,
  COVER_MIME_TYPES,
  FILE_EXTENSION_BY_MIME_TYPE,
} from "@/lib/storage/file-policy"

export const COVER_MAX_BYTES = 5 * 1024 * 1024

const coverMimeTypes = new Set<string>(COVER_MIME_TYPES)

const safeFileNameSchema = z
  .string()
  .trim()
  .min(1, "Nama file tidak tersedia.")
  .max(255, "Batasi nama file hingga 255 karakter.")
  .refine(
    (value) => !/[\\/\u0000-\u001f\u007f]/.test(value),
    "Nama file mengandung karakter yang tidak didukung."
  )

const uploadBaseSchema = z.object({
  productId: z.uuid("ID produk tidak valid."),
  originalName: safeFileNameSchema,
  mimeType: z.string().trim().toLowerCase().max(255),
  fileSize: z.number().int().positive("File kosong tidak dapat diunggah."),
})

export const createUploadIntentSchema = z.discriminatedUnion("kind", [
  uploadBaseSchema.extend({
    kind: z.literal("cover"),
    altText: z
      .string()
      .trim()
      .min(1, "Tambahkan teks alternatif gambar.")
      .max(500, "Batasi teks alternatif hingga 500 karakter."),
  }),
  uploadBaseSchema.extend({
    kind: z.literal("asset"),
    downloadName: safeFileNameSchema,
  }),
])

export const completeUploadSchema = z.object({
  productId: z.uuid("ID produk tidak valid."),
  uploadId: z.uuid("ID upload tidak valid."),
  kind: z.enum(["cover", "asset"]),
})

export const removeUploadSchema = completeUploadSchema

export type CreateUploadIntentInput = z.input<
  typeof createUploadIntentSchema
>
export type CompleteUploadInput = z.input<typeof completeUploadSchema>
export type UploadKind = z.output<typeof completeUploadSchema>["kind"]

export function validateUploadRequest(
  input: z.output<typeof createUploadIntentSchema>
) {
  const extension = FILE_EXTENSION_BY_MIME_TYPE[input.mimeType]

  if (!extension) {
    return { success: false as const, message: "Jenis file tidak didukung." }
  }

  const originalExtension = input.originalName.split(".").at(-1)?.toLowerCase()
  const allowedExtensions = ALLOWED_EXTENSIONS_BY_MIME_TYPE[input.mimeType]

  if (!originalExtension || !allowedExtensions?.has(originalExtension)) {
    return {
      success: false as const,
      message: "Ekstensi file tidak sesuai dengan jenis file.",
    }
  }

  if (input.kind === "asset") {
    const downloadExtension = input.downloadName
      .split(".")
      .at(-1)
      ?.toLowerCase()

    if (!downloadExtension || !allowedExtensions.has(downloadExtension)) {
      return {
        success: false as const,
        message: "Gunakan ekstensi file yang sama pada nama file unduhan.",
      }
    }
  }

  if (input.kind === "cover") {
    if (!coverMimeTypes.has(input.mimeType)) {
      return {
        success: false as const,
        message: "Pilih gambar JPEG, PNG, atau WebP.",
      }
    }

    if (input.fileSize > COVER_MAX_BYTES) {
      return {
        success: false as const,
        message: "Pilih gambar berukuran maksimal 5 MB.",
      }
    }
  } else {
    const config = getStorageConfig()

    if (!config.productAssetAllowedMimeTypes.has(input.mimeType)) {
      return {
        success: false as const,
        message: "Jenis file produk tidak didukung.",
      }
    }

    if (input.fileSize > config.productAssetMaxBytes) {
      return {
        success: false as const,
        message: `Pilih file berukuran maksimal ${formatBytes(config.productAssetMaxBytes)}.`,
      }
    }
  }

  return { success: true as const, extension }
}

export function normalizeMimeType(value: string | undefined) {
  return value?.split(";", 1)[0]?.trim().toLowerCase() ?? ""
}

export function mimeTypesMatch(declared: string, detected: string) {
  if (declared === detected) {
    return true
  }

  return (
    (declared === "application/x-zip-compressed" &&
      detected === "application/zip") ||
    (declared === "application/zip" &&
      detected === "application/x-zip-compressed")
  )
}
