"use client"

import Link from "next/link"
import { startTransition, useActionState, useCallback, useState } from "react"
import { Archive, CircleAlert, Ellipsis, Pencil, RefreshCcw } from "lucide-react"

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
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Spinner } from "@/components/ui/spinner"
import type { ProductStatus } from "@/lib/catalog/constants"
import type { ProductLifecycleState } from "@/lib/catalog/validation"

type ProductTableActionsProps = {
  action: (
    previousState: ProductLifecycleState,
    formData: FormData
  ) => Promise<ProductLifecycleState>
  productId: string
  productName: string
  status: ProductStatus
}

const initialState: ProductLifecycleState = {}

export function ProductTableActions({
  action,
  productId,
  productName,
  status,
}: ProductTableActionsProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  const actionWithUiState = useCallback(
    async (
      previousState: ProductLifecycleState,
      formData: FormData
    ): Promise<ProductLifecycleState> => {
      const nextState = await action(previousState, formData)

      if (nextState.success) {
        startTransition(() => {
          setMenuOpen(false)
          setArchiveOpen(false)
        })
      }

      return nextState
    },
    [action]
  )

  const [state, formAction, pending] = useActionState(
    actionWithUiState,
    initialState
  )

  return (
    <>
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger
          className={buttonVariants({
            variant: "ghost",
            size: "icon-sm",
          })}
          aria-label={`Buka tindakan untuk ${productName}`}
        >
          <Ellipsis aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            render={<Link href={`/admin/produk/${productId}`} />}
          >
            <Pencil aria-hidden="true" />
            Edit produk
          </DropdownMenuItem>

          {status === "archived" ? (
            <form action={formAction}>
              <input type="hidden" name="intent" value="restore" />
              <DropdownMenuItem
                closeOnClick={false}
                disabled={pending}
                nativeButton
                render={<button type="submit" />}
              >
                {pending ? (
                  <Spinner aria-hidden="true" />
                ) : (
                  <RefreshCcw aria-hidden="true" />
                )}
                Kembalikan ke draf
              </DropdownMenuItem>
            </form>
          ) : (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setArchiveOpen(true)}
            >
              <Archive aria-hidden="true" />
              Arsipkan produk
            </DropdownMenuItem>
          )}

          {state.intent === "restore" && state.message ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel role="alert">
                <span className="flex items-start gap-2 text-destructive">
                  <CircleAlert aria-hidden="true" />
                  <span>{state.message}</span>
                </span>
              </DropdownMenuLabel>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {status !== "archived" ? (
        <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogMedia>
                <Archive aria-hidden="true" />
              </AlertDialogMedia>
              <AlertDialogTitle>Arsipkan produk?</AlertDialogTitle>
              <AlertDialogDescription>
                “{productName}” akan disembunyikan dari katalog. Produk tetap
                tersimpan dan dapat dikembalikan ke draf.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {state.intent === "archive" && state.message ? (
              <Alert variant="destructive">
                <CircleAlert aria-hidden="true" />
                <AlertTitle>Produk belum diarsipkan</AlertTitle>
                <AlertDescription>{state.message}</AlertDescription>
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
                    <Archive data-icon="inline-start" aria-hidden="true" />
                  )}
                  Arsipkan produk
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </>
  )
}
