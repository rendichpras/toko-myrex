import { describe, expect, test } from "bun:test"

import { formatBytes } from "@/lib/format"
import { getMimeTypeFromFileName } from "@/lib/storage/file-policy"

describe("kebijakan file", () => {
  test("menentukan MIME type saat browser tidak menyediakannya", () => {
    expect(getMimeTypeFromFileName("panduan.pdf")).toBe("application/pdf")
    expect(getMimeTypeFromFileName("template.ZIP")).toBe(
      "application/x-zip-compressed"
    )
  })

  test("tidak menebak ekstensi yang tidak didukung", () => {
    expect(getMimeTypeFromFileName("program.exe")).toBeNull()
  })

  test("menampilkan byte tanpa pecahan kilobyte", () => {
    expect(formatBytes(92)).toBe("92 B")
  })
})
