import type { NextConfig } from "next"

const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value:
      "base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
  },
  {
    key: "Permissions-Policy",
    value:
      "browsing-topics=(), camera=(), geolocation=(), microphone=(), payment=(), usb=()",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
]

function getMediaRemotePatterns() {
  const value = process.env.R2_MEDIA_PUBLIC_URL

  if (!value) {
    return []
  }

  try {
    const url = new URL(value)
    url.pathname = `${url.pathname.replace(/\/$/, "")}/**`
    url.search = ""
    return [url]
  } catch {
    return []
  }
}

const mediaRemotePatterns = getMediaRemotePatterns()

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images:
    mediaRemotePatterns.length > 0
      ? { remotePatterns: mediaRemotePatterns }
      : undefined,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
