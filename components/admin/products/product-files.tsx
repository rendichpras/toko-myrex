"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import {
  CircleAlert,
  FileArchive,
  ImageIcon,
  Trash2,
  Upload,
} from "lucide-react"

import {
  completeProductUpload,
  createProductUploadIntent,
  removeProductUpload,
} from "@/app/(admin)/admin/produk/actions"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress"
import { Spinner } from "@/components/ui/spinner"
import type {
  ProductAssetDTO,
  ProductMediaDTO,
} from "@/lib/catalog/dto"

type UploadKind = "cover" | "asset"

type UploadState = {
  file: File | null
  progress: number
  uploading: boolean
  message: string | null
}

const emptyUploadState: UploadState = {
  file: null,
  progress: 0,
  uploading: false,
  message: null,
}

const fileStatusLabels = {
  pending: "Menunggu verifikasi",
  ready: "Siap",
  rejected: "Ditolak",
  archived: "Diarsipkan",
} as const

const fileStatusVariants = {
  pending: "secondary",
  ready: "default",
  rejected: "destructive",
  archived: "outline",
} as const

function formatBytes(bytes: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "unit",
    unit: bytes >= 1024 * 1024 ? "megabyte" : "kilobyte",
    unitDisplay: "short",
    maximumFractionDigits: 1,
  }).format(bytes / (bytes >= 1024 * 1024 ? 1024 * 1024 : 1024))
}

function putFile(
  url: string,
  file: File,
  contentType: string,
  onProgress: (progress: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest()

    request.open("PUT", url)
    request.setRequestHeader("Content-Type", contentType)
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    })
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100)
        resolve()
        return
      }

      reject(new Error("R2 menolak unggahan."))
    })
    request.addEventListener("error", () => {
      reject(new Error("Browser tidak dapat menghubungi penyimpanan."))
    })
    request.addEventListener("abort", () => {
      reject(new Error("Unggahan dibatalkan."))
    })
    request.send(file)
  })
}

function RemoveFileButton({
  kind,
  productId,
  uploadId,
  label,
}: {
  kind: UploadKind
  productId: string
  uploadId: string
  label: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function remove() {
    setPending(true)
    setMessage(null)

    try {
      const result = await removeProductUpload({ productId, uploadId, kind })

      if (!result.success) {
        setMessage(result.message)
        return
      }

      setOpen(false)
      router.refresh()
    } catch {
      setMessage("File belum dihapus. Coba lagi.")
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
        aria-label={`Hapus ${label}`}
        title={`Hapus ${label}`}
      >
        <Trash2 aria-hidden="true" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia>
            <Trash2 aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>Hapus file?</AlertDialogTitle>
          <AlertDialogDescription>
            {label} akan dihapus dari produk.{" "}
            {kind === "asset"
              ? "File siap tetap disimpan secara privat sebagai riwayat versi."
              : "Tambahkan sampul baru sebelum menerbitkan produk."}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {message ? (
          <Alert variant="destructive">
            <CircleAlert aria-hidden="true" />
            <AlertTitle>File belum dihapus</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Batal</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={remove}
          >
            {pending ? <Spinner aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
            Hapus file
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export function ProductFiles({
  assetMaxBytes,
  assets,
  disabled,
  media,
  productId,
  productName,
  storageConfigured,
}: {
  assetMaxBytes: number
  assets: ProductAssetDTO[]
  disabled: boolean
  media: ProductMediaDTO[]
  productId: string
  productName: string
  storageConfigured: boolean
}) {
  const router = useRouter()
  const [cover, setCover] = useState<UploadState>(emptyUploadState)
  const [asset, setAsset] = useState<UploadState>(emptyUploadState)
  const [altText, setAltText] = useState(productName)
  const [downloadName, setDownloadName] = useState("")
  const readyCover = media.find(
    (item) => item.role === "cover" && item.status === "ready"
  )
  const unfinishedCovers = media.filter(
    (item) =>
      item.role === "cover" &&
      item.status !== "ready" &&
      item.status !== "archived"
  )
  const visibleAssets = assets.filter((item) => item.status !== "archived")
  const controlsDisabled = disabled || !storageConfigured

  function selectFile(kind: UploadKind, file: File | null) {
    const setter = kind === "cover" ? setCover : setAsset
    setter({ ...emptyUploadState, file })

    if (kind === "asset" && file) {
      setDownloadName(file.name)
    }
  }

  async function upload(kind: UploadKind) {
    const state = kind === "cover" ? cover : asset
    const setState = kind === "cover" ? setCover : setAsset
    const file = state.file

    if (!file) {
      setState((current) => ({ ...current, message: "Pilih file terlebih dahulu." }))
      return
    }

    setState((current) => ({
      ...current,
      progress: 0,
      uploading: true,
      message: null,
    }))

    try {
      const intent = await createProductUploadIntent(
        kind === "cover"
          ? {
              kind,
              productId,
              originalName: file.name,
              mimeType: file.type,
              fileSize: file.size,
              altText,
            }
          : {
              kind,
              productId,
              originalName: file.name,
              mimeType: file.type,
              fileSize: file.size,
              downloadName,
            }
      )

      if (!intent.success) {
        setState((current) => ({ ...current, message: intent.message }))
        return
      }

      await putFile(
        intent.data.uploadUrl,
        file,
        intent.data.contentType,
        (progress) =>
          setState((current) => ({ ...current, progress }))
      )

      const completed = await completeProductUpload({
        kind,
        productId,
        uploadId: intent.data.uploadId,
      })

      if (!completed.success) {
        setState((current) => ({ ...current, message: completed.message }))
        return
      }

      setState(emptyUploadState)
      if (kind === "asset") {
        setDownloadName("")
      }
      router.refresh()
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Unggahan terputus."
      setState((current) => ({
        ...current,
        message: `${reason} Periksa koneksi dan CORS bucket, lalu coba lagi.`,
      }))
    } finally {
      setState((current) => ({ ...current, uploading: false }))
    }
  }

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:items-start">
      <Card>
        <CardHeader>
          <CardTitle>Gambar sampul</CardTitle>
          <CardDescription>
            Tambahkan gambar JPEG, PNG, atau WebP berukuran maksimal 5 MB.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {readyCover ? (
              <div className="flex min-w-0 items-center gap-3 border p-3">
                {readyCover.publicUrl && readyCover.width && readyCover.height ? (
                  <Image
                    src={readyCover.publicUrl}
                    alt={readyCover.altText ?? ""}
                    width={readyCover.width}
                    height={readyCover.height}
                    className="size-16 shrink-0 object-cover"
                  />
                ) : (
                  <span className="flex size-16 shrink-0 items-center justify-center bg-muted text-muted-foreground">
                    <ImageIcon aria-hidden="true" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Sampul saat ini</p>
                  <p className="truncate text-muted-foreground">
                    {readyCover.width} × {readyCover.height} · {formatBytes(readyCover.fileSize)}
                  </p>
                </div>
                {!disabled ? (
                  <RemoveFileButton
                    kind="cover"
                    productId={productId}
                    uploadId={readyCover.id}
                    label="gambar sampul"
                  />
                ) : null}
              </div>
            ) : null}

            {unfinishedCovers.map((item) => (
              <div key={item.id} className="flex min-w-0 items-center gap-3 border p-3">
                <ImageIcon
                  className="shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">Unggahan sampul</p>
                  <p className="text-muted-foreground">
                    {formatBytes(item.fileSize)}
                  </p>
                </div>
                <Badge variant={fileStatusVariants[item.status]}>
                  {fileStatusLabels[item.status]}
                </Badge>
                {!disabled ? (
                  <RemoveFileButton
                    kind="cover"
                    productId={productId}
                    uploadId={item.id}
                    label="unggahan sampul"
                  />
                ) : null}
              </div>
            ))}

            <Field>
              <FieldLabel htmlFor="cover-file">Pilih gambar</FieldLabel>
              <Input
                id="cover-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={controlsDisabled || cover.uploading}
                onChange={(event) =>
                  selectFile("cover", event.target.files?.[0] ?? null)
                }
              />
              <FieldDescription>
                Gambar baru menggantikan sampul saat ini setelah verifikasi selesai.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="cover-alt">Teks alternatif</FieldLabel>
              <Input
                id="cover-alt"
                value={altText}
                maxLength={500}
                disabled={controlsDisabled || cover.uploading}
                onChange={(event) => setAltText(event.target.value)}
              />
              <FieldDescription>
                Jelaskan isi gambar secara singkat untuk pembaca layar.
              </FieldDescription>
            </Field>

            {cover.uploading ? (
              <Progress value={cover.progress}>
                <ProgressLabel>Mengunggah gambar</ProgressLabel>
                <ProgressValue>
                  {(_formattedValue, value) => `${value ?? 0}%`}
                </ProgressValue>
              </Progress>
            ) : null}

            {cover.message ? (
              <Alert variant="destructive">
                <CircleAlert aria-hidden="true" />
                <AlertTitle>Gambar belum diunggah</AlertTitle>
                <AlertDescription>{cover.message}</AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="button"
              disabled={controlsDisabled || cover.uploading || !cover.file}
              onClick={() => upload("cover")}
            >
              {cover.uploading ? <Spinner aria-hidden="true" /> : <Upload aria-hidden="true" />}
              {readyCover ? "Ganti sampul" : "Unggah sampul"}
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>File produk</CardTitle>
          <CardDescription>
            Tambahkan PDF atau ZIP yang akan diterima pelanggan. Ukuran maksimal{" "}
            {formatBytes(assetMaxBytes)}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {visibleAssets.length > 0 ? (
              <div className="grid gap-2">
                {visibleAssets.map((item) => (
                  <div key={item.id} className="flex min-w-0 items-center gap-3 border p-3">
                    <FileArchive className="shrink-0 text-muted-foreground" aria-hidden="true" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{item.downloadName}</p>
                      <p className="truncate text-muted-foreground">
                        Versi {item.version} · {formatBytes(item.fileSize)}
                      </p>
                    </div>
                    <Badge variant={fileStatusVariants[item.status]}>
                      {fileStatusLabels[item.status]}
                    </Badge>
                    {!disabled ? (
                      <RemoveFileButton
                        kind="asset"
                        productId={productId}
                        uploadId={item.id}
                        label={item.downloadName}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            <Field>
              <FieldLabel htmlFor="asset-file">Pilih file</FieldLabel>
              <Input
                id="asset-file"
                type="file"
                accept="application/pdf,application/zip,application/x-zip-compressed,.pdf,.zip"
                disabled={controlsDisabled || asset.uploading}
                onChange={(event) =>
                  selectFile("asset", event.target.files?.[0] ?? null)
                }
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="download-name">Nama file unduhan</FieldLabel>
              <Input
                id="download-name"
                value={downloadName}
                maxLength={255}
                placeholder="Contoh: template-laporan.zip"
                disabled={controlsDisabled || asset.uploading}
                onChange={(event) => setDownloadName(event.target.value)}
              />
              <FieldDescription>
                Nama ini akan dilihat pelanggan saat mengunduh file.
              </FieldDescription>
            </Field>

            {asset.uploading ? (
              <Progress value={asset.progress}>
                <ProgressLabel>Mengunggah file</ProgressLabel>
                <ProgressValue>
                  {(_formattedValue, value) => `${value ?? 0}%`}
                </ProgressValue>
              </Progress>
            ) : null}

            {asset.message ? (
              <Alert variant="destructive">
                <CircleAlert aria-hidden="true" />
                <AlertTitle>File belum diunggah</AlertTitle>
                <AlertDescription>{asset.message}</AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="button"
              disabled={
                controlsDisabled ||
                asset.uploading ||
                !asset.file ||
                !downloadName.trim()
              }
              onClick={() => upload("asset")}
            >
              {asset.uploading ? <Spinner aria-hidden="true" /> : <Upload aria-hidden="true" />}
              Unggah file
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>

      {!storageConfigured ? (
        <Alert className="lg:col-span-2">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Unggah file belum tersedia</AlertTitle>
          <AlertDescription>
            Lengkapi konfigurasi Cloudflare R2 untuk mengunggah sampul dan file produk.
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  )
}
