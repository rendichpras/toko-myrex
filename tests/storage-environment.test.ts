import { describe, expect, test } from "bun:test"

import {
  parseScannerEnvironment,
  parseStorageEnvironment,
} from "@/lib/storage/environment"

const validEnvironment = {
  R2_ACCOUNT_ID: "account",
  R2_ACCESS_KEY_ID: "access-key",
  R2_SECRET_ACCESS_KEY: "secret-key",
  R2_MEDIA_BUCKET: "store-media",
  R2_PRIVATE_BUCKET: "store-private",
  R2_MEDIA_PUBLIC_URL: "https://media.example.com",
  R2_UPLOAD_EXPIRES_SECONDS: "300",
  PRODUCT_ASSET_MAX_BYTES: "104857600",
  PRODUCT_ASSET_ALLOWED_MIME_TYPES:
    "application/pdf,application/zip,application/x-zip-compressed",
}

describe("konfigurasi storage", () => {
  test("menerima konfigurasi dua bucket yang terpisah", () => {
    expect(parseStorageEnvironment(validEnvironment).success).toBe(true)
  })

  test("menolak bucket media dan privat yang sama", () => {
    const result = parseStorageEnvironment({
      ...validEnvironment,
      R2_PRIVATE_BUCKET: validEnvironment.R2_MEDIA_BUCKET,
    })

    expect(result.success).toBe(false)
  })

  test("menolak URL media tanpa HTTPS", () => {
    const result = parseStorageEnvironment({
      ...validEnvironment,
      R2_MEDIA_PUBLIC_URL: "http://media.example.com",
    })

    expect(result.success).toBe(false)
  })

  test("menolak MIME type yang belum didukung implementasi", () => {
    const result = parseStorageEnvironment({
      ...validEnvironment,
      PRODUCT_ASSET_ALLOWED_MIME_TYPES: "application/x-msdownload",
    })

    expect(result.success).toBe(false)
  })

  test("memvalidasi konfigurasi ClamAV", () => {
    expect(
      parseScannerEnvironment({
        CLAMAV_HOST: "127.0.0.1",
        CLAMAV_PORT: "3310",
        CLAMAV_TIMEOUT_MS: "120000",
      }).success
    ).toBe(true)
  })
})
