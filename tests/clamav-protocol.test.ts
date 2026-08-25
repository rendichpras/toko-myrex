import { describe, expect, test } from "bun:test"

import { parseClamAvResponse } from "@/lib/storage/clamav-protocol"

describe("respons ClamAV", () => {
  test("menerima file bersih", () => {
    expect(parseClamAvResponse("stream: OK\0")).toEqual({ status: "clean" })
  })

  test("meneruskan nama ancaman", () => {
    expect(parseClamAvResponse("stream: Eicar-Signature FOUND\0")).toEqual({
      status: "infected",
      threat: "Eicar-Signature",
    })
  })

  test("menolak respons error", () => {
    expect(() => parseClamAvResponse("stream: Access denied ERROR\0")).toThrow()
  })
})
