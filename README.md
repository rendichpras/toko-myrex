# Toko Myrex

Aplikasi toko produk digital berbasis Next.js, Better Auth, PostgreSQL/Drizzle, Resend, dan Cloudflare R2.

## Prasyarat

- Bun 1.4+
- PostgreSQL
- kredensial Resend untuk email transaksional
- Cloudflare R2 jika fitur upload produk digunakan

## Menjalankan secara lokal

```bash
bun install
cp .env.example .env.local
bun run db:migrate
bun run dev
```

Environment minimum untuk menjalankan core aplikasi dan production build:

- `DATABASE_URL`
- `BETTER_AUTH_SECRET` minimal 32 karakter
- `BETTER_AUTH_URL` (`http://localhost:3000` untuk development; HTTPS wajib di production)

Email verifikasi/reset membutuhkan `RESEND_API_KEY` dan `EMAIL_FROM`. Isi `EMAIL_FROM` dengan sender pada domain yang sudah diverifikasi di Resend, misalnya `Toko Myrex <noreply@example.com>`. `RESEND_WEBHOOK_SECRET` hanya diperlukan untuk endpoint webhook Resend. Konfigurasi `R2_*` bersifat opsional sampai fitur upload produk digunakan.

Jangan commit `.env.local` atau secret production ke repository.

## Database

Schema berada di `lib/db/schema/` dan migration berada di `drizzle/`.

```bash
bun run db:generate  # generate migration setelah perubahan schema
bun run db:migrate   # jalankan migration yang sudah direview
bun run db:studio    # inspeksi database secara lokal
```

Jangan mengubah schema production hanya dengan `push`; perubahan schema harus menghasilkan migration yang dapat direview dan direproduksi.

## Authentication

Authentication menggunakan Better Auth. Admin wajib memiliki role `admin` dan verifikasi dua langkah aktif sebelum dapat menggunakan fitur admin.

Untuk operasi CLI:

```bash
bun run auth:generate
bun run auth:create-admin
```

## File produk

Upload menggunakan R2. File masuk ke storage privat terlebih dahulu dan baru ditandai siap setelah metadata, ukuran, signature/MIME, dan integritasnya diverifikasi. Gambar sampul juga diproses ulang menggunakan Sharp sebelum dipublikasikan.

Browser mengunggah langsung ke bucket privat melalui presigned `PUT` URL. Karena request tersebut lintas origin, bucket yang dipakai oleh `R2_PRIVATE_BUCKET` wajib memiliki CORS policy yang mengizinkan setiap origin aplikasi yang benar-benar digunakan. Contoh untuk development lokal dan production:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:3000",
      "https://example.com"
    ],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Ganti `https://example.com` dengan origin production sebenarnya. Origin CORS harus cocok persis dan tidak boleh menyertakan path. Presigned upload juga mengikat `Content-Type`, jadi header yang dikirim browser harus sama dengan tipe yang digunakan saat URL dibuat.

Cleanup upload lama dapat diperiksa tanpa menghapus data:

```bash
bun run catalog:cleanup-uploads --dry-run
```

## Quality gate lokal

Sebelum membuat atau menggabungkan perubahan:

```bash
bun run verify
```

`verify` menjalankan lint, Next.js route type generation, TypeScript, tests, dan production build. Refactor tidak dianggap selesai hanya karena aplikasi dapat berjalan di development mode.

Aturan kontribusi untuk coding agent dan perubahan arsitektur ada di [`AGENTS.md`](./AGENTS.md).
