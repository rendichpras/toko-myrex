import { describe, expect, test } from "bun:test"

import {
  getSafeRedirectPath,
  resolvePostSignInPath,
} from "@/lib/auth/safe-redirect"

describe("redirect auth", () => {
  test("mempertahankan path same-origin beserta query dan hash", () => {
    expect(getSafeRedirectPath("/admin/produk?page=2#hasil")).toBe(
      "/admin/produk?page=2#hasil"
    )
  })

  test("menolak URL absolut dan protocol-relative", () => {
    expect(getSafeRedirectPath("https://example.com/phishing", "/masuk")).toBe(
      "/masuk"
    )
    expect(getSafeRedirectPath("//example.com/phishing", "/masuk")).toBe(
      "/masuk"
    )
  })

  test("menolak backslash yang dinormalisasi menjadi origin lain", () => {
    expect(getSafeRedirectPath("/\\example.com/phishing", "/masuk")).toBe(
      "/masuk"
    )
  })

  test("menggunakan elemen pertama untuk nilai search param berbentuk array", () => {
    expect(getSafeRedirectPath(["/admin", "//example.com"])).toBe("/admin")
  })

  test("memilih tujuan default berdasarkan role setelah sign in", () => {
    expect(resolvePostSignInPath(undefined, true)).toBe("/admin")
    expect(resolvePostSignInPath(undefined, false)).toBe("/")
    expect(resolvePostSignInPath("/akun", true)).toBe("/akun")
  })
})
