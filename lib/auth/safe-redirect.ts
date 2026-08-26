export const ADMIN_HOME_PATH = "/admin/produk"

export function isAdminPath(path: string | undefined) {
  return path === "/admin" || path?.startsWith("/admin/") === true
}

export function getSafeRedirectPath(
  value: string | string[] | undefined,
  fallback = "/"
) {
  const requestedPath = Array.isArray(value) ? value[0] : value

  if (!requestedPath?.startsWith("/") || requestedPath.startsWith("//")) {
    return fallback
  }

  try {
    const baseUrl = new URL("https://app.invalid")
    const targetUrl = new URL(requestedPath, baseUrl)

    if (targetUrl.origin !== baseUrl.origin) {
      return fallback
    }

    return `${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`
  } catch {
    return fallback
  }
}

export function resolvePostSignInPath(
  requestedPath: string | undefined,
  userIsAdmin: boolean
) {
  if (isAdminPath(requestedPath) && !userIsAdmin) {
    return "/"
  }

  return requestedPath || (userIsAdmin ? ADMIN_HOME_PATH : "/")
}
