import "server-only"

import { createHash } from "node:crypto"

import { fileTypeFromBuffer } from "file-type"
import sharp from "sharp"

import { getObject, headObject } from "@/lib/storage"
import {
  COVER_MAX_BYTES,
  mimeTypesMatch,
  normalizeMimeType,
} from "@/lib/storage/validation"

export class CatalogUploadError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "invalid_file"
      | "invalid_state"
      | "not_ready"
      | "temporary_failure" = "invalid_state",
    public readonly retryable = false
  ) {
    super(message)
    this.name = "CatalogUploadError"
  }
}

const maximumCoverDimension = 12_000
const maximumCoverPixels = 40_000_000

function invalidFile(message: string) {
  return new CatalogUploadError(
    `${message} Pilih file lain, lalu coba lagi.`,
    "invalid_file"
  )
}

export async function verifyStagedObjectMetadata({
  storageKey,
  expectedSize,
  expectedMimeType,
}: {
  storageKey: string
  expectedSize: number
  expectedMimeType: string
}) {
  let metadata

  try {
    metadata = await headObject("private", storageKey)
  } catch {
    throw new CatalogUploadError(
      "Unggahan belum ditemukan. Unggah file lagi, lalu coba verifikasi.",
      "not_ready",
      true
    )
  }

  if (metadata.ContentLength !== expectedSize) {
    throw invalidFile("Ukuran file yang diterima tidak sesuai.")
  }

  if (normalizeMimeType(metadata.ContentType) !== expectedMimeType) {
    throw invalidFile("Jenis file yang diterima tidak sesuai.")
  }

  if (!metadata.ETag) {
    throw new CatalogUploadError(
      "Identitas file belum tersedia. Coba verifikasi lagi.",
      "not_ready",
      true
    )
  }

  return metadata
}

async function sanitizeCoverImage(bytes: Uint8Array, mimeType: string) {
  try {
    const image = await sharp(bytes).metadata()

    if (!image.width || !image.height) {
      throw invalidFile("Dimensi gambar tidak dapat dibaca.")
    }

    if (
      image.width > maximumCoverDimension ||
      image.height > maximumCoverDimension ||
      image.width * image.height > maximumCoverPixels
    ) {
      throw invalidFile("Dimensi gambar terlalu besar.")
    }

    if ((image.pages ?? 1) > 1) {
      throw invalidFile("Gambar animasi tidak didukung.")
    }

    const pipeline = sharp(bytes).autoOrient()
    let extension: "jpg" | "png" | "webp"

    switch (mimeType) {
      case "image/jpeg":
        pipeline.jpeg({ quality: 90, progressive: true })
        extension = "jpg"
        break
      case "image/png":
        pipeline.png({ compressionLevel: 9 })
        extension = "png"
        break
      case "image/webp":
        pipeline.webp({ quality: 90 })
        extension = "webp"
        break
      default:
        throw invalidFile("Jenis gambar tidak didukung.")
    }

    const sanitized = await pipeline.toBuffer({ resolveWithObject: true })

    if (sanitized.data.byteLength > COVER_MAX_BYTES) {
      throw invalidFile("Ukuran gambar setelah diproses terlalu besar.")
    }

    return { ...sanitized, extension }
  } catch (error) {
    if (error instanceof CatalogUploadError) {
      throw error
    }

    throw invalidFile("Data gambar tidak dapat diproses.")
  }
}

export async function verifyCoverUpload({
  storageKey,
  expectedSize,
  expectedMimeType,
}: {
  storageKey: string
  expectedSize: number
  expectedMimeType: string
}) {
  await verifyStagedObjectMetadata({
    storageKey,
    expectedSize,
    expectedMimeType,
  })

  const object = await getObject("private", storageKey)

  if (!object.Body) {
    throw invalidFile("Isi gambar tidak dapat dibaca.")
  }

  const bytes = await object.Body.transformToByteArray()

  if (bytes.byteLength !== expectedSize) {
    throw invalidFile("Ukuran gambar yang dibaca tidak sesuai.")
  }

  const detected = await fileTypeFromBuffer(bytes)

  if (!detected || !mimeTypesMatch(expectedMimeType, detected.mime)) {
    throw invalidFile("Signature gambar tidak sesuai.")
  }

  const sanitized = await sanitizeCoverImage(bytes, detected.mime)

  return {
    data: sanitized.data,
    width: sanitized.info.width,
    height: sanitized.info.height,
    extension: sanitized.extension,
    mimeType: detected.mime,
  }
}

export async function verifyAssetContent({
  storageKey,
  expectedSize,
  expectedMimeType,
}: {
  storageKey: string
  expectedSize: number
  expectedMimeType: string
}) {
  const object = await getObject("private", storageKey)

  if (!object.Body) {
    throw invalidFile("Isi file tidak dapat dibaca.")
  }

  const hash = createHash("sha256")
  const signatureChunks: Uint8Array[] = []
  let signatureLength = 0
  let bytesRead = 0

  for await (const chunk of object.Body as AsyncIterable<Uint8Array>) {
    hash.update(chunk)
    bytesRead += chunk.byteLength

    if (signatureLength < 8192) {
      const remaining = 8192 - signatureLength
      const part = chunk.subarray(0, remaining)
      signatureChunks.push(part)
      signatureLength += part.byteLength
    }
  }

  if (bytesRead !== expectedSize) {
    throw invalidFile("Ukuran file yang dibaca tidak sesuai.")
  }

  const signature = new Uint8Array(signatureLength)
  let offset = 0

  for (const chunk of signatureChunks) {
    signature.set(chunk, offset)
    offset += chunk.byteLength
  }

  let detected

  try {
    detected = await fileTypeFromBuffer(signature)
  } catch {
    throw invalidFile("Signature file tidak dapat dibaca.")
  }

  if (!detected || !mimeTypesMatch(expectedMimeType, detected.mime)) {
    throw invalidFile("Signature file tidak sesuai.")
  }

  return { checksum: hash.digest("hex") }
}
