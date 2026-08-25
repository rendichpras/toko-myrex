export type MalwareScanResult =
  | { status: "clean" }
  | { status: "infected"; threat: string }

export function parseClamAvResponse(value: string): MalwareScanResult {
  const response = value.replace(/\0+$/g, "").trim()

  if (response.endsWith(": OK")) {
    return { status: "clean" }
  }

  const infectedMatch = response.match(/^stream: (.+) FOUND$/)

  if (infectedMatch?.[1]) {
    return { status: "infected", threat: infectedMatch[1] }
  }

  throw new Error(`Pemindai malware mengembalikan respons tidak valid: ${response}`)
}
