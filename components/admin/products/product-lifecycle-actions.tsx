"use client"

import { useActionState } from "react"
import {
  Archive,
  CircleAlert,
  RefreshCcw,
  Send,
} from "lucide-react"

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
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import type { ProductStatus } from "@/lib/catalog/constants"
import type { ProductLifecycleState } from "@/lib/catalog/validation"

type ProductLifecycleActionsProps = {
  action: (
    previousState: ProductLifecycleState,
    formData: FormData
  ) => Promise<ProductLifecycleState>
  canPublish: boolean
  productName: string
  publicationRequirementsId?: string
  status: ProductStatus
}

const initialState: ProductLifecycleState = {}

const lifecycleDescriptions: Record<ProductStatus, string> = {
  draft: "Terbitkan produk setelah semua persyaratan lengkap, atau arsipkan jika tidak digunakan.",
  published: "Produk tampil di katalog dan siap dibeli pelanggan.",
  archived: "Kembalikan produk ke draf untuk mengubah atau menerbitkannya lagi.",
}

export function ProductLifecycleActions({
  action,
  canPublish,
  productName,
  publicationRequirementsId,
  status,
}: ProductLifecycleActionsProps) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const archiveError = state.intent === "archive" ? state.message : undefined
  const visibleError = state.intent !== "archive" ? state.message : undefined

  return (
    <div className="grid gap-3">
      {visibleError ? (
        <Alert variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Status belum berubah</AlertTitle>
          <AlertDescription>{visibleError}</AlertDescription>
        </Alert>
      ) : null}

      <Card size="sm">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="font-medium">Status produk</h2>
            <p className="text-muted-foreground">
              {lifecycleDescriptions[status]}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {status === "draft" ? (
              <form action={formAction}>
                <input type="hidden" name="intent" value="publish" />
                <Button
                  type="submit"
                  disabled={!canPublish || pending}
                  aria-describedby={
                    !canPublish ? publicationRequirementsId : undefined
                  }
                >
                  {pending ? (
                    <Spinner aria-hidden="true" />
                  ) : (
                    <Send data-icon="inline-start" aria-hidden="true" />
                  )}
                  Terbitkan produk
                </Button>
              </form>
            ) : null}

            {status === "archived" ? (
              <form action={formAction}>
                <input type="hidden" name="intent" value="restore" />
                <Button type="submit" disabled={pending}>
                  {pending ? (
                    <Spinner aria-hidden="true" />
                  ) : (
                    <RefreshCcw
                      data-icon="inline-start"
                      aria-hidden="true"
                    />
                  )}
                  Kembalikan ke draf
                </Button>
              </form>
            ) : (
              <AlertDialog>
                <AlertDialogTrigger
                  className={buttonVariants({ variant: "destructive" })}
                  disabled={pending}
                >
                  <Archive data-icon="inline-start" aria-hidden="true" />
                  Arsipkan produk
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogMedia>
                      <Archive aria-hidden="true" />
                    </AlertDialogMedia>
                    <AlertDialogTitle>Arsipkan produk?</AlertDialogTitle>
                    <AlertDialogDescription>
                      “{productName}” akan disembunyikan dari katalog. Produk
                      tetap tersimpan dan dapat dikembalikan ke draf.
                    </AlertDialogDescription>
                  </AlertDialogHeader>

                  {archiveError ? (
                    <Alert variant="destructive">
                      <CircleAlert aria-hidden="true" />
                      <AlertTitle>Produk belum diarsipkan</AlertTitle>
                      <AlertDescription>{archiveError}</AlertDescription>
                    </Alert>
                  ) : null}

                  <form action={formAction}>
                    <input type="hidden" name="intent" value="archive" />
                    <AlertDialogFooter>
                      <AlertDialogCancel type="button" disabled={pending}>
                        Batal
                      </AlertDialogCancel>
                      <AlertDialogAction
                        type="submit"
                        variant="destructive"
                        disabled={pending}
                      >
                        {pending ? (
                          <Spinner aria-hidden="true" />
                        ) : (
                          <Archive
                            data-icon="inline-start"
                            aria-hidden="true"
                          />
                        )}
                        Arsipkan produk
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </form>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
