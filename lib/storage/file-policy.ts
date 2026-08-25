export const COVER_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const

export const PRODUCT_ASSET_MIME_TYPES = [
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
] as const

export const FILE_EXTENSION_BY_MIME_TYPE: Readonly<Record<string, string>> = {
  "application/pdf": "pdf",
  "application/x-zip-compressed": "zip",
  "application/zip": "zip",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export const ALLOWED_EXTENSIONS_BY_MIME_TYPE: Readonly<
  Record<string, ReadonlySet<string>>
> = {
  "application/pdf": new Set(["pdf"]),
  "application/x-zip-compressed": new Set(["zip"]),
  "application/zip": new Set(["zip"]),
  "image/jpeg": new Set(["jpg", "jpeg"]),
  "image/png": new Set(["png"]),
  "image/webp": new Set(["webp"]),
}

export function getMimeTypeFromFileName(fileName: string) {
  const extension = fileName.split(".").at(-1)?.toLowerCase()

  if (!extension) {
    return null
  }

  return (
    Object.entries(ALLOWED_EXTENSIONS_BY_MIME_TYPE).find(([, extensions]) =>
      extensions.has(extension)
    )?.[0] ?? null
  )
}
