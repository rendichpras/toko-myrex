"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import { CircleAlert, FileArchive, ImageIcon, Upload } from "lucide-react"

import {
  completeProductUpload,
  createProductUploadIntent,
  removeProductUpload,
} from "@/app/(admin)/admin/produk/actions"
import { RemoveProductFileButton } from "@/components/admin/products/remove-product-file-button"
import {
  uploadFileToStorage,
  type ProductUploadKind,
} from "@/components/admin/products/product-upload-client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  ProductAssetClientDTO,
  ProductCoverClientDTO,
} from "@/lib/catalog/dto"
import { formatBytes } from "@/lib/format"
import {
  PRODUCT_ASSET_MIME_TYPES,
  getMimeTypeFromFileName,
} from "@/lib/storage/file-policy"

type UploadState = {
  file: File | null
  progress: number
  phase: "idle" | "uploading" | "verifying"
  uploadId: string | null
  message: string | null
}

const emptyUploadState: UploadState = {
  file: null,
  progress: 0,
  phase: "idle",
  uploadId: null,
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

const assetAccept = [...PRODUCT_ASSET_MIME_TYPES, ".pdf", ".zip"].join(",")

async function cleanupIncompleteUpload(
  kind: ProductUploadKind,
  productId: string,
  uploadId: string
) {
  try {
    const result = await removeProductUpload({ kind, productId, uploadId })

    if (!result.success) {
      console.error("Cleanup unggahan produk gagal:", result.message)
    }
  } catch (error) {
    console.error("Cleanup unggahan produk gagal.", error)
  }
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
  assets: ProductAssetClientDTO[]
  disabled: boolean
  media: ProductCoverClientDTO[]
  productId: string
  productName: string
  storageConfigured: boolean
}) {
  const coverInputRef = useRef<HTMLInputElement>(null)
  const assetInputRef = useRef<HTMLInputElement>(null)
  const [cover, setCover] = useState<UploadState>(emptyUploadState)
  const [asset, setAsset] = useState<UploadState>(emptyUploadState)
  const [altTextOverride, setAltTextOverride] = useState<string | null>(null)
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
  const coverBusy = cover.phase !== "idle"
  const assetBusy = asset.phase !== "idle"
  const altText = altTextOverride ?? productName

  function selectFile(kind: ProductUploadKind, file: File | null) {
    const setter = kind === "cover" ? setCover : setAsset
    setter({ ...emptyUploadState, file })

    if (kind === "asset") {
      setDownloadName(file?.name ?? "")
    }
  }

  function resetInput(kind: ProductUploadKind) {
    const input = kind === "cover" ? coverInputRef.current : assetInputRef.current

    if (input) {
      input.value = ""
    }

    if (kind === "asset") {
      setDownloadName("")
    }
  }

  async function upload(kind: ProductUploadKind) {
    const state = kind === "cover" ? cover : asset
    const setState = kind === "cover" ? setCover : setAsset
    const file = state.file
    const mimeType = file
      ? file.type || getMimeTypeFromFileName(file.name) || ""
      : ""
    let uploadId = state.uploadId
    let succeeded = false

    if (!file) {
      setState((current) => ({
        ...current,
        message: "Pilih file terlebih dahulu.",
      }))
      return
    }

    setState((current) => ({
      ...current,
      progress: current.uploadId ? 100 : 0,
      phase: current.uploadId ? "verifying" : "uploading",
      message: null,
    }))

    try {
      if (!uploadId) {
        const intent = await createProductUploadIntent(
          kind === "cover"
            ? {
                kind,
                productId,
                originalName: file.name,
                mimeType,
                fileSize: file.size,
                altText,
              }
            : {
                kind,
                productId,
                originalName: file.name,
                mimeType,
                fileSize: file.size,
                downloadName,
              }
        )

        if (!intent.success) {
          setState((current) => ({ ...current, message: intent.message }))
          return
        }

        uploadId = intent.data.uploadId

        try {
          await uploadFileToStorage(
            intent.data.uploadUrl,
            file,
            intent.data.contentType,
            (progress) => setState((current) => ({ ...current, progress }))
          )
        } catch (error) {
          await cleanupIncompleteUpload(kind, productId, uploadId)
          uploadId = null
          throw error
        }

        setState((current) => ({
          ...current,
          phase: "verifying",
          progress: 100,
          uploadId,
        }))
      }

      const completed = await completeProductUpload({
        kind,
        productId,
        uploadId,
      })

      if (!completed.success) {
        if (completed.retryable) {
          setState((current) => ({
            ...current,
            uploadId,
            message: completed.message,
          }))
        } else {
          setState({ ...emptyUploadState, message: completed.message })
          resetInput(kind)
        }

        return
      }

      succeeded = true
      setState(emptyUploadState)
      resetInput(kind)
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : "Unggahan terputus."
      setState((current) => ({
        ...current,
        uploadId,
        message: `${reason} Periksa koneksi, lalu coba lagi.`,
      }))
    } finally {
      if (!succeeded) {
        setState((current) => ({ ...current, phase: "idle" }))
      }
    }
  }

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-2 lg:items-start">
      <Card>
        <CardHeader>
          <CardTitle role="heading" aria-level={2}>
            Gambar sampul
          </CardTitle>
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
                  <RemoveProductFileButton
                    kind="cover"
                    productId={productId}
                    uploadId={readyCover.id}
                    label="gambar sampul"
                    status={readyCover.status}
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
                  {item.rejectionReason ? (
                    <p className="text-destructive">{item.rejectionReason}</p>
                  ) : null}
                </div>
                <Badge variant={fileStatusVariants[item.status]}>
                  {fileStatusLabels[item.status]}
                </Badge>
                {!disabled ? (
                  <RemoveProductFileButton
                    kind="cover"
                    productId={productId}
                    uploadId={item.id}
                    label="unggahan sampul"
                    status={item.status}
                  />
                ) : null}
              </div>
            ))}

            <Field>
              <FieldLabel htmlFor="cover-file">Pilih gambar</FieldLabel>
              <Input
                ref={coverInputRef}
                id="cover-file"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={controlsDisabled || coverBusy}
                aria-describedby="cover-file-description"
                onChange={(event) =>
                  selectFile("cover", event.target.files?.[0] ?? null)
                }
              />
              <FieldDescription id="cover-file-description">
                Gambar baru menggantikan sampul saat ini setelah verifikasi selesai.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="cover-alt">Teks alternatif</FieldLabel>
              <Input
                id="cover-alt"
                value={altText}
                maxLength={500}
                disabled={controlsDisabled || coverBusy}
                onChange={(event) => setAltTextOverride(event.target.value)}
              />
              <FieldDescription>
                Jelaskan isi gambar secara singkat untuk pembaca layar.
              </FieldDescription>
            </Field>

            {coverBusy ? (
              <Progress value={cover.progress}>
                <ProgressLabel>
                  {cover.phase === "verifying"
                    ? "Memverifikasi gambar"
                    : "Mengunggah gambar"}
                </ProgressLabel>
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
              disabled={controlsDisabled || coverBusy || !cover.file}
              onClick={() => upload("cover")}
            >
              {coverBusy ? (
                <Spinner aria-hidden="true" />
              ) : (
                <Upload data-icon="inline-start" aria-hidden="true" />
              )}
              {cover.phase === "verifying"
                ? "Memverifikasi sampul"
                : readyCover
                  ? "Ganti sampul"
                  : "Unggah sampul"}
            </Button>
          </FieldGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle role="heading" aria-level={2}>
            File produk
          </CardTitle>
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
                      {item.rejectionReason ? (
                        <p className="text-destructive">
                          {item.rejectionReason}
                        </p>
                      ) : null}
                    </div>
                    <Badge variant={fileStatusVariants[item.status]}>
                      {fileStatusLabels[item.status]}
                    </Badge>
                    {!disabled ? (
                      <RemoveProductFileButton
                        kind="asset"
                        productId={productId}
                        uploadId={item.id}
                        label={item.downloadName}
                        status={item.status}
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            <Field>
              <FieldLabel htmlFor="asset-file">Pilih file</FieldLabel>
              <Input
                ref={assetInputRef}
                id="asset-file"
                type="file"
                accept={assetAccept}
                disabled={controlsDisabled || assetBusy}
                aria-describedby="asset-file-description"
                onChange={(event) =>
                  selectFile("asset", event.target.files?.[0] ?? null)
                }
              />
              <FieldDescription id="asset-file-description">
                Jenis dan integritas file diverifikasi sebelum tersedia untuk pelanggan.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="download-name">Nama file unduhan</FieldLabel>
              <Input
                id="download-name"
                value={downloadName}
                maxLength={255}
                placeholder="Contoh: template-laporan.zip"
                disabled={controlsDisabled || assetBusy}
                onChange={(event) => setDownloadName(event.target.value)}
              />
              <FieldDescription>
                Nama ini akan dilihat pelanggan saat mengunduh file.
              </FieldDescription>
            </Field>

            {assetBusy ? (
              <Progress value={asset.progress}>
                <ProgressLabel>
                  {asset.phase === "verifying"
                    ? "Memverifikasi file"
                    : "Mengunggah file"}
                </ProgressLabel>
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
                assetBusy ||
                !asset.file ||
                !downloadName.trim()
              }
              onClick={() => upload("asset")}
            >
              {assetBusy ? (
                <Spinner aria-hidden="true" />
              ) : (
                <Upload data-icon="inline-start" aria-hidden="true" />
              )}
              {asset.phase === "verifying"
                ? "Memverifikasi file"
                : asset.uploadId
                  ? "Coba verifikasi lagi"
                  : "Unggah file"}
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
