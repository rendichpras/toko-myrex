# Toko Myrex

Toko produk digital dengan area pelanggan dan panel administrasi. Aplikasi ini
menggunakan Next.js App Router, Better Auth, PostgreSQL, Drizzle ORM, dan Resend.

## Menjalankan aplikasi

Prasyarat:

- Bun 1.4 atau versi kompatibel
- PostgreSQL yang dapat diakses dari mesin lokal
- akun Resend untuk alur email dan webhook

Salin `.env.example` menjadi `.env.local`, lalu isi seluruh nilai yang diperlukan.
Setelah itu jalankan:

```bash
bun install
bun run db:migrate
bun run dev
```

Aplikasi tersedia di `http://localhost:3000`.

## Struktur kode

- `app/` berisi route, layout, metadata, dan endpoint HTTP.
- `components/auth/` berisi antarmuka serta interaksi autentikasi.
- `components/admin/` berisi kerangka navigasi panel admin.
- `components/ui/` berisi UI primitive dari shadcn; pertahankan API komponennya
  agar pembaruan melalui CLI tetap aman.
- `lib/db/` menangani koneksi, schema, dan konfigurasi PostgreSQL.
- `lib/auth/` menangani konfigurasi Better Auth, sesi, otorisasi, dan validasi.
- `lib/email/` menangani pengiriman email serta pencatatan webhook Resend.
- `drizzle/` berisi migration dan snapshot yang dihasilkan Drizzle Kit.

Halaman autentikasi berbagi layout melalui route group `app/(auth)`. Otorisasi
admin tetap diperiksa di server melalui `requireAdmin`; pemeriksaan cookie di
`proxy.ts` hanya digunakan sebagai pengalihan awal, bukan sebagai batas keamanan.

## Pemeriksaan sebelum commit

```bash
bun run lint
bun run typecheck
bun run build
```

Untuk menjalankan lint dan type-check sekaligus, gunakan `bun run check`.

Tidak ada test runner di repository saat ini. Ketika fitur domain pertama mulai
memiliki aturan bisnis, tambahkan pengujian pada batas tersebut alih-alih menguji
detail implementasi komponen.

## Perintah operasional

```bash
bun run auth:generate       # perbarui schema Better Auth
bun run auth:create-admin   # buat akun admin
bun run db:generate         # buat migration dari perubahan schema
bun run db:migrate          # terapkan migration
bun run db:studio           # buka Drizzle Studio
```

Jangan mengubah `lib/db/schema/auth.ts`, file migration, atau snapshot secara
manual. Gunakan generator masing-masing agar schema dan riwayat migration tetap
selaras.
