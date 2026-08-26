const LOOPBACK_HOSTNAMES = new Set(["localhost", "127.0.0.1", "[::1]"])

export function resolveAuthBaseUrl(
  configuredUrl: string | undefined,
  environment = process.env.NODE_ENV
) {
  if (!configuredUrl) {
    if (environment === "production") {
      throw new Error("BETTER_AUTH_URL harus dikonfigurasi di production.")
    }

    return "http://localhost:3000"
  }

  let url: URL

  try {
    url = new URL(configuredUrl)
  } catch {
    throw new Error("BETTER_AUTH_URL harus berupa URL yang valid.")
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("BETTER_AUTH_URL harus menggunakan HTTP atau HTTPS.")
  }

  const isLoopback = LOOPBACK_HOSTNAMES.has(url.hostname)

  if (environment === "production" && url.protocol !== "https:" && !isLoopback) {
    throw new Error(
      "BETTER_AUTH_URL non-lokal harus menggunakan HTTPS di production."
    )
  }

  return url.origin
}
