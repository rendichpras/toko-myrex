import { toNextJsHandler } from "better-auth/next-js"

import { auth } from "@/lib/auth"
import { assertAuthEnvironment } from "@/lib/auth-env"

const handlers = toNextJsHandler(auth)

export async function GET(request: Request) {
  assertAuthEnvironment()
  return handlers.GET(request)
}

export async function POST(request: Request) {
  assertAuthEnvironment()
  return handlers.POST(request)
}
