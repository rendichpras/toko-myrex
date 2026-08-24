export function getSafeRedirectPath(
  value: string | string[] | undefined,
  fallback = "/"
) {
  const path = Array.isArray(value) ? value[0] : value

  if (!path?.startsWith("/") || path.startsWith("//")) {
    return fallback
  }

  try {
    const baseUrl = new URL("https://toko-myrex.local")
    const targetUrl = new URL(path, baseUrl)

    if (targetUrl.origin !== baseUrl.origin) {
      return fallback
    }

    return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`
  } catch {
    return fallback
  }
}
