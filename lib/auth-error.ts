type AuthClientError = {
  code?: string
  status?: number
}

export function getAuthErrorMessage(
  error: AuthClientError,
  fallback: string
) {
  if (error.status === 429) {
    return "Terlalu banyak percobaan. Tunggu beberapa saat, lalu coba lagi."
  }

  switch (error.code) {
    case "EMAIL_NOT_VERIFIED":
      return "Email belum diverifikasi. Tautan verifikasi baru telah dikirim."
    case "INVALID_EMAIL_OR_PASSWORD":
    case "INVALID_PASSWORD":
    case "USER_NOT_FOUND":
      return "Email atau kata sandi tidak cocok."
    case "INVALID_TOKEN":
    case "TOKEN_EXPIRED":
      return "Tautan tidak valid atau sudah kedaluwarsa. Gunakan tautan terbaru."
    default:
      return fallback
  }
}
