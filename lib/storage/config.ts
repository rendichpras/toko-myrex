import "server-only"

import {
  DEFAULT_PRODUCT_ASSET_MAX_BYTES,
  parseProductAssetMaxBytes,
  parsePublicMediaUrl,
  parseStorageEnvironment,
} from "@/lib/storage/environment"

export type StorageConfig = {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  mediaBucket: string
  privateBucket: string
  mediaPublicUrl: string
  uploadExpiresSeconds: number
  productAssetMaxBytes: number
  productAssetAllowedMimeTypes: ReadonlySet<string>
}

let cachedConfig: StorageConfig | undefined

function readStorageEnvironment() {
  return parseStorageEnvironment({
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_MEDIA_BUCKET: process.env.R2_MEDIA_BUCKET,
    R2_PRIVATE_BUCKET: process.env.R2_PRIVATE_BUCKET,
    R2_MEDIA_PUBLIC_URL: process.env.R2_MEDIA_PUBLIC_URL,
    R2_UPLOAD_EXPIRES_SECONDS:
      process.env.R2_UPLOAD_EXPIRES_SECONDS ?? "300",
    PRODUCT_ASSET_MAX_BYTES:
      process.env.PRODUCT_ASSET_MAX_BYTES ??
      String(DEFAULT_PRODUCT_ASSET_MAX_BYTES),
    PRODUCT_ASSET_ALLOWED_MIME_TYPES:
      process.env.PRODUCT_ASSET_ALLOWED_MIME_TYPES ??
      "application/pdf,application/zip,application/x-zip-compressed",
  })
}

export function isStorageConfigured() {
  return cachedConfig !== undefined || readStorageEnvironment().success
}

export function getProductAssetMaxBytes() {
  const parsed = parseProductAssetMaxBytes(
    process.env.PRODUCT_ASSET_MAX_BYTES ?? DEFAULT_PRODUCT_ASSET_MAX_BYTES
  )

  return parsed.success ? parsed.data : DEFAULT_PRODUCT_ASSET_MAX_BYTES
}

export function getStorageConfig(): StorageConfig {
  if (cachedConfig) {
    return cachedConfig
  }

  const parsed = readStorageEnvironment()

  if (!parsed.success) {
    throw new Error("Konfigurasi penyimpanan R2 belum lengkap.")
  }

  cachedConfig = {
    accountId: parsed.data.R2_ACCOUNT_ID,
    accessKeyId: parsed.data.R2_ACCESS_KEY_ID,
    secretAccessKey: parsed.data.R2_SECRET_ACCESS_KEY,
    mediaBucket: parsed.data.R2_MEDIA_BUCKET,
    privateBucket: parsed.data.R2_PRIVATE_BUCKET,
    mediaPublicUrl: parsed.data.R2_MEDIA_PUBLIC_URL.replace(/\/$/, ""),
    uploadExpiresSeconds: parsed.data.R2_UPLOAD_EXPIRES_SECONDS,
    productAssetMaxBytes: parsed.data.PRODUCT_ASSET_MAX_BYTES,
    productAssetAllowedMimeTypes: new Set(
      parsed.data.PRODUCT_ASSET_ALLOWED_MIME_TYPES.split(",")
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean)
    ),
  }

  return cachedConfig
}

export function getPublicMediaUrl(storageKey: string) {
  const parsed = parsePublicMediaUrl(process.env.R2_MEDIA_PUBLIC_URL)

  if (!parsed.success) {
    return null
  }

  const baseUrl = parsed.data.replace(/\/$/, "")
  const encodedKey = storageKey.split("/").map(encodeURIComponent).join("/")

  return `${baseUrl}/${encodedKey}`
}
