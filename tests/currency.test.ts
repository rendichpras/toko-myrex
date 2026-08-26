import { describe, expect, test } from "bun:test"

import { formatIdr } from "@/lib/currency"

describe("format mata uang", () => {
  test("memformat harga IDR tanpa pecahan", () => {
    expect(formatIdr(0)).toStartWith("Rp")
    expect(formatIdr(0)).toEndWith("0")
    expect(formatIdr(1_250_000)).toContain("1.250.000")
  })
})
