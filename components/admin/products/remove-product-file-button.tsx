"use client"

import { useState } from "react"
import { CircleAlert, Trash2 } from "lucide-react"

import { removeProductUpload } from "@/app/(admin)/admin/produk/actions"
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
import { buttonVariants } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { ProductFileStatus } from "@/lib/catalog/constants"
import type { ProductUploadKind } from "@/components/admin/products/product-upload-client"

export function RemoveProductFileButton({
  kind,
  productId,
  uploadId,
  label,
  status,
}: {
  kind: ProductUploadKind
  productId: string
  uploadId: string
  label: string
  status: ProductFileStatus
}) {
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
    } catch {
      setMessage("File belum dihapus. Coba lagi.")
    } finally {
      setPending(false)
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setMessage(null)
      }}
    >
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
            {kind === "asset" && status === "ready"
              ? "File siap tetap disimpan secara privat sebagai riwayat versi."
              : kind === "cover" && status === "ready"
                ? "Tambahkan sampul baru sebelum menerbitkan produk."
                : "Unggahan yang belum siap akan dihapus dari penyimpanan."}
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
