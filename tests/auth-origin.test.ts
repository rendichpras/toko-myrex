import { describe, expect, test } from "bun:test"

import { resolveAuthBaseUrl } from "@/lib/auth/origin"

describe("auth origin", () => {
  test("mengizinkan HTTP loopback saat production build lokal", () => {
    expect(resolveAuthBaseUrl("http://localhost:3000", "production")).toBe(
      "http://localhost:3000"
    )
    expect(resolveAuthBaseUrl("http://127.0.0.1:3000", "production")).toBe(
      "http://127.0.0.1:3000"
    )
    expect(resolveAuthBaseUrl("http://[::1]:3000", "production")).toBe(
      "http://[::1]:3000"
    )
  })

  test("mewajibkan HTTPS untuk origin production non-lokal", () => {
    expect(() =>
      resolveAuthBaseUrl("http://toko.example.com", "production")
    ).toThrow("BETTER_AUTH_URL non-lokal harus menggunakan HTTPS di production.")

    expect(resolveAuthBaseUrl("https://toko.example.com/path", "production")).toBe(
      "https://toko.example.com"
    )
  })

  test("menolak protokol selain HTTP dan HTTPS", () => {
    expect(() => resolveAuthBaseUrl("ftp://localhost", "development")).toThrow(
      "BETTER_AUTH_URL harus menggunakan HTTP atau HTTPS."
    )
  })

  test("tetap mewajibkan BETTER_AUTH_URL pada production", () => {
    expect(() => resolveAuthBaseUrl(undefined, "production")).toThrow(
      "BETTER_AUTH_URL harus dikonfigurasi di production."
    )
  })
})
