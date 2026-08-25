"use client"

import Link from "next/link"
import { useActionState, useEffect, useRef, useState } from "react"
import { CircleAlert, CircleCheck, Save } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import type {
  ProductFormField,
  ProductFormState,
} from "@/lib/catalog/validation"

type ProductFormValues = {
  name: string
  slug: string
  summary: string | null
  description: string | null
  priceAmount: number
  sku: string | null
}

type ProductFormProps = {
  action: (
    previousState: ProductFormState,
    formData: FormData
  ) => Promise<ProductFormState>
  defaultValues?: ProductFormValues
  disabled?: boolean
  submitLabel: string
}

const initialState: ProductFormState = {}

const productFormFieldLabels: Record<ProductFormField, string> = {
  name: "Nama produk",
  slug: "Slug",
  summary: "Ringkasan",
  description: "Deskripsi",
  priceAmount: "Harga produk",
  sku: "SKU",
}

function fieldErrors(errors: string[] | undefined) {
  return errors?.map((message) => ({ message }))
}

function createSlugCandidate(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function ProductForm({
  action,
  defaultValues,
  disabled = false,
  submitLabel,
}: ProductFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState)
  const errorFeedbackRef = useRef<HTMLDivElement>(null)
  const [changedSinceSubmit, setChangedSinceSubmit] = useState(false)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(
    Boolean(defaultValues?.slug)
  )
  const [values, setValues] = useState({
    name: defaultValues?.name ?? "",
    slug: defaultValues?.slug ?? "",
    summary: defaultValues?.summary ?? "",
    description: defaultValues?.description ?? "",
    priceAmount:
      defaultValues?.priceAmount === undefined
        ? ""
        : String(defaultValues.priceAmount),
    sku: defaultValues?.sku ?? "",
  })
  const formErrors = Object.entries(state.errors ?? {}).filter(
    (entry): entry is [ProductFormField, string[]] =>
      Boolean(entry[1]?.length)
  )

  function updateValue(field: keyof typeof values, value: string) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }))
  }

  useEffect(() => {
    if (state.message && !changedSinceSubmit && !pending) {
      errorFeedbackRef.current?.focus()
    }
  }, [changedSinceSubmit, pending, state])

  return (
    <form
      action={formAction}
      className="grid min-w-0 gap-6"
      onChange={() => setChangedSinceSubmit(true)}
      onSubmit={() => setChangedSinceSubmit(false)}
    >
      {state.message && !changedSinceSubmit && !pending ? (
        <Alert ref={errorFeedbackRef} tabIndex={-1} variant="destructive">
          <CircleAlert aria-hidden="true" />
          <AlertTitle>Perubahan belum disimpan</AlertTitle>
          <AlertDescription>
            <p>{state.message}</p>
            {formErrors.length > 0 ? (
              <ul className="list-disc pl-4">
                {formErrors.map(([field, messages]) => (
                  <li key={field}>
                    <a href={`#${field}`}>
                      {productFormFieldLabels[field]}: {messages[0]}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </AlertDescription>
        </Alert>
      ) : null}

      {state.success && !changedSinceSubmit && !pending ? (
        <Alert>
          <CircleCheck aria-hidden="true" />
          <AlertTitle>Perubahan disimpan</AlertTitle>
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <Card>
          <CardHeader>
            <CardTitle>Informasi produk</CardTitle>
            <CardDescription>
              Informasi yang akan dilihat pelanggan di katalog.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field data-invalid={Boolean(state.errors?.name)}>
                <FieldLabel htmlFor="name">Nama produk</FieldLabel>
                <Input
                  id="name"
                  name="name"
                  value={values.name}
                  onChange={(event) => {
                    const name = event.target.value

                    setValues((currentValues) => ({
                      ...currentValues,
                      name,
                      slug: slugManuallyEdited
                        ? currentValues.slug
                        : createSlugCandidate(name),
                    }))
                  }}
                  placeholder="Contoh: Template laporan keuangan"
                  maxLength={160}
                  required
                  disabled={disabled || pending}
                  autoComplete="off"
                  aria-invalid={Boolean(state.errors?.name)}
                  aria-describedby={
                    state.errors?.name ? "name-error" : undefined
                  }
                />
                <FieldError
                  id="name-error"
                  errors={fieldErrors(state.errors?.name)}
                />
              </Field>

              <Field data-invalid={Boolean(state.errors?.slug)}>
                <FieldLabel htmlFor="slug">Slug</FieldLabel>
                <Input
                  id="slug"
                  name="slug"
                  value={values.slug}
                  onChange={(event) => {
                    const slug = event.target.value.toLowerCase()

                    setSlugManuallyEdited(Boolean(slug))
                    updateValue("slug", slug)
                  }}
                  placeholder="template-laporan-keuangan"
                  maxLength={200}
                  required
                  disabled={disabled || pending}
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={Boolean(state.errors?.slug)}
                  aria-describedby={
                    state.errors?.slug
                      ? "slug-description slug-error"
                      : "slug-description"
                  }
                />
                <FieldDescription id="slug-description">
                  {defaultValues
                    ? "Slug digunakan dalam URL publik. Gunakan huruf kecil, angka, dan tanda hubung."
                    : "Slug dibuat otomatis dari nama. Anda dapat mengubahnya sebelum menyimpan."}
                </FieldDescription>
                <FieldError
                  id="slug-error"
                  errors={fieldErrors(state.errors?.slug)}
                />
              </Field>

              <Field data-invalid={Boolean(state.errors?.summary)}>
                <FieldLabel htmlFor="summary">Ringkasan</FieldLabel>
                <Textarea
                  id="summary"
                  name="summary"
                  value={values.summary}
                  onChange={(event) =>
                    updateValue("summary", event.target.value)
                  }
                  placeholder="Jelaskan manfaat utama produk secara singkat."
                  maxLength={320}
                  rows={3}
                  disabled={disabled || pending}
                  aria-invalid={Boolean(state.errors?.summary)}
                  aria-describedby={
                    state.errors?.summary
                      ? "summary-description summary-error"
                      : "summary-description"
                  }
                />
                <FieldDescription id="summary-description">
                  Tampil pada kartu produk. Opsional. Maksimal 320 karakter.
                </FieldDescription>
                <FieldError
                  id="summary-error"
                  errors={fieldErrors(state.errors?.summary)}
                />
              </Field>

              <Field data-invalid={Boolean(state.errors?.description)}>
                <FieldLabel htmlFor="description">Deskripsi</FieldLabel>
                <Textarea
                  id="description"
                  name="description"
                  value={values.description}
                  onChange={(event) =>
                    updateValue("description", event.target.value)
                  }
                  placeholder="Jelaskan isi, manfaat, dan cara menggunakan produk."
                  maxLength={100_000}
                  rows={12}
                  disabled={disabled || pending}
                  aria-invalid={Boolean(state.errors?.description)}
                  aria-describedby={
                    state.errors?.description
                      ? "description-description description-error"
                      : "description-description"
                  }
                />
                <FieldDescription id="description-description">
                  Wajib untuk menerbitkan produk. Gunakan Markdown untuk
                  memformat teks.
                </FieldDescription>
                <FieldError
                  id="description-error"
                  errors={fieldErrors(state.errors?.description)}
                />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:sticky lg:top-6">
          <Card>
            <CardHeader>
              <CardTitle>Harga dan SKU</CardTitle>
              <CardDescription>
                Tetapkan harga dan kode internal produk.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FieldGroup>
                <Field data-invalid={Boolean(state.errors?.priceAmount)}>
                  <FieldLabel htmlFor="priceAmount">Harga produk</FieldLabel>
                  <InputGroup>
                    <InputGroupAddon>Rp</InputGroupAddon>
                    <InputGroupInput
                      id="priceAmount"
                      name="priceAmount"
                      type="number"
                      inputMode="numeric"
                      value={values.priceAmount}
                      onChange={(event) =>
                        updateValue("priceAmount", event.target.value)
                      }
                      placeholder="0"
                      min={0}
                      max={2_147_483_647}
                      step={1}
                      required
                      disabled={disabled || pending}
                      autoComplete="off"
                      aria-invalid={Boolean(state.errors?.priceAmount)}
                      aria-describedby={
                        state.errors?.priceAmount
                          ? "price-description price-error"
                          : "price-description"
                      }
                    />
                  </InputGroup>
                  <FieldDescription id="price-description">
                    Gunakan 0 untuk produk gratis.
                  </FieldDescription>
                  <FieldError
                    id="price-error"
                    errors={fieldErrors(state.errors?.priceAmount)}
                  />
                </Field>

                <Field data-invalid={Boolean(state.errors?.sku)}>
                  <FieldLabel htmlFor="sku">SKU</FieldLabel>
                  <Input
                    id="sku"
                    name="sku"
                    value={values.sku}
                    onChange={(event) =>
                      updateValue("sku", event.target.value.toUpperCase())
                    }
                    placeholder="PRODUK-001"
                    maxLength={100}
                    disabled={disabled || pending}
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    aria-invalid={Boolean(state.errors?.sku)}
                    aria-describedby={
                      state.errors?.sku
                        ? "sku-description sku-error"
                        : "sku-description"
                    }
                  />
                  <FieldDescription id="sku-description">
                    Opsional. Gunakan kode unik untuk mengelola produk secara
                    internal.
                  </FieldDescription>
                  <FieldError
                    id="sku-error"
                    errors={fieldErrors(state.errors?.sku)}
                  />
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="flex-col-reverse items-stretch gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                nativeButton={false}
                render={<Link href="/admin/produk" />}
              >
                Batal
              </Button>
              <Button type="submit" disabled={disabled || pending}>
                {pending ? (
                  <Spinner aria-hidden="true" />
                ) : (
                  <Save data-icon="inline-start" aria-hidden="true" />
                )}
                {pending ? "Menyimpan" : submitLabel}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </form>
  )
}
