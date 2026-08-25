# Toko Myrex

Toko produk digital dengan area pelanggan dan panel administrasi. Aplikasi ini
menggunakan Next.js App Router, Better Auth, PostgreSQL, Drizzle ORM, dan Resend.

## Menjalankan aplikasi

Prasyarat:

- Bun 1.4 atau versi kompatibel
- PostgreSQL yang dapat diakses dari mesin lokal
- Akun Resend untuk alur email dan webhook

Salin `.env.example` menjadi `.env.local`, lalu isi seluruh nilai yang diperlukan.
Setelah itu jalankan:

```bash
bun install
bun run db:migrate
bun run dev
```

Aplikasi tersedia di `http://localhost:3000`.

## Penyimpanan file produk

Pengunggahan produk menggunakan dua bucket Cloudflare R2:

- `R2_MEDIA_BUCKET` menyimpan gambar sampul yang sudah diverifikasi dan boleh
  diakses publik.
- `R2_PRIVATE_BUCKET` menyimpan staging unggahan dan seluruh file digital.

Isi variabel `R2_*` dan kebijakan file produk di `.env.local`. Atur custom domain
atau URL publik bucket media pada `R2_MEDIA_PUBLIC_URL`. Bucket privat harus
memiliki kebijakan CORS untuk origin aplikasi agar browser dapat menjalankan PUT
ke presigned URL. Contoh pengembangan lokal:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Tambahkan origin produksi secara eksplisit sebelum deployment. Jangan gunakan
wildcard untuk origin admin.

Objek yang belum selesai diproses memakai prefix `staging/`. Tambahkan lifecycle
rule pada bucket privat untuk menghapus prefix tersebut setelah masa retensi yang
sesuai. Jangan terapkan rule itu pada prefix `products/`, karena prefix tersebut
berisi file siap dan riwayat versi produk.

## Struktur kode

- `app/` berisi route, layout, metadata, dan endpoint HTTP.
- `components/auth/` berisi antarmuka serta interaksi autentikasi.
- `components/admin/` berisi kerangka navigasi panel admin.
- `components/ui/` berisi UI primitive dari shadcn; pertahankan API komponennya
  agar pembaruan melalui CLI tetap aman.
- `lib/db/` menangani koneksi, schema, dan konfigurasi PostgreSQL.
- `lib/auth/` menangani konfigurasi Better Auth, sesi, otorisasi, dan validasi.
- `lib/catalog/` menangani aturan domain, DTO, query, dan mutation katalog
  produk digital.
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

## Standar implementasi

Dasarkan setiap implementasi pada dokumentasi resmi terbaru yang sesuai dengan
versi dependency proyek. Baca dokumentasi lokal dependency jika tersedia, lalu
gunakan dokumentasi resmi penerbit sebagai sumber utama untuk API, pola, batasan,
keamanan, dan keputusan arsitektur. Jangan menetapkan perilaku hanya berdasarkan
ingatan, asumsi, atau contoh yang tidak dapat diverifikasi.

## Standar copywriting

Semua teks yang terlihat pengguna mengikuti
[Microsoft Writing Style Guide](https://learn.microsoft.com/en-us/style-guide/welcome/)
dan disesuaikan secara alami ke bahasa Indonesia. Gunakan kalimat yang singkat,
jelas, langsung, dan membantu pengguna menentukan tindakan berikutnya.

- Gunakan kapitalisasi gaya kalimat untuk judul, label, tombol, dan status.
- Mulai label tindakan dengan kata kerja yang spesifik.
- Jelaskan masalah dan cara memperbaikinya dalam pesan kesalahan.
- Gunakan istilah yang sama di seluruh antarmuka, seperti `draf`, `diterbitkan`,
  dan `diarsipkan`.
- Pastikan tautan dan label aksesibilitas tetap bermakna tanpa konteks visual.

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
