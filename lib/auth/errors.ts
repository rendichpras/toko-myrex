type AuthClientError = {
  code?: string
  status?: number
}

export const authConnectionErrorMessage =
  "Layanan belum dapat dijangkau. Periksa koneksi internet, lalu coba lagi."

export const compromisedPasswordMessage =
  "Kata sandi ini pernah ditemukan dalam kebocoran data. Gunakan kata sandi lain."

export function getAuthErrorMessage(
  error: AuthClientError,
  fallback: string
) {
  if (error.status === 429) {
    return "Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi."
  }

  switch (error.code) {
    case "PASSWORD_COMPROMISED":
      return compromisedPasswordMessage
    case "EMAIL_NOT_VERIFIED":
      return "Email belum diverifikasi. Gunakan tautan verifikasi terbaru yang dikirim melalui email."
    case "INVALID_EMAIL_OR_PASSWORD":
    case "INVALID_PASSWORD":
    case "USER_NOT_FOUND":
      return "Email atau kata sandi tidak cocok."
    case "BANNED_USER":
      return "Akun ini tidak dapat digunakan. Hubungi dukungan jika Anda memerlukan bantuan."
    case "INVALID_CODE":
      return "Kode tidak cocok. Masukkan kode terbaru dari aplikasi autentikator."
    case "INVALID_BACKUP_CODE":
      return "Kode cadangan tidak cocok atau sudah digunakan."
    case "INVALID_TWO_FACTOR_COOKIE":
      return "Sesi verifikasi berakhir. Mulai lagi proses masuk."
    case "TOTP_NOT_ENABLED":
    case "TWO_FACTOR_NOT_ENABLED":
      return "Aplikasi autentikator belum terhubung. Mulai lagi proses aktivasi."
    case "TWO_FACTOR_REQUIRED":
      return "Aktifkan verifikasi dua langkah untuk mengakses fitur admin."
    case "INVALID_TOKEN":
    case "TOKEN_EXPIRED":
      return "Tautan ini tidak berlaku lagi. Minta tautan baru."
    default:
      return fallback
  }
}
