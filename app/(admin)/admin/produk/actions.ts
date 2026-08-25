"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireAdmin } from "@/lib/auth/session"
import {
  archiveCatalogProduct,
  CatalogMutationError,
  createCatalogProduct,
  publishCatalogProduct,
  restoreCatalogProduct,
  updateCatalogProduct,
} from "@/lib/catalog/mutations"
import {
  createProductInputSchema,
  productIdSchema,
  productLifecycleActionSchema,
  type ProductFormState,
  type ProductLifecycleState,
} from "@/lib/catalog/validation"

function readProductForm(formData: FormData) {
  return createProductInputSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    summary: formData.get("summary"),
    description: formData.get("description"),
    priceAmount: formData.get("priceAmount"),
    sku: formData.get("sku"),
  })
}

function getCatalogErrorState(error: CatalogMutationError): ProductFormState {
  if (error.code === "slug_conflict") {
    return {
      errors: { slug: [error.message] },
      message: "Periksa kolom yang ditandai.",
    }
  }

  if (error.code === "sku_conflict") {
    return {
      errors: { sku: [error.message] },
      message: "Periksa kolom yang ditandai.",
    }
  }

  if (error.code === "publication_incomplete") {
    const errors: ProductFormState["errors"] = {}

    for (const issue of error.publicationIssues) {
      if (
        issue.field === "name" ||
        issue.field === "slug" ||
        issue.field === "description" ||
        issue.field === "priceAmount"
      ) {
        errors[issue.field] = [issue.message]
      }
    }

    return { errors, message: error.message }
  }

  return { message: error.message }
}

export async function createProduct(
  _previousState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin("/admin/produk/baru")

  const parsed = readProductForm(formData)

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Periksa kolom yang ditandai.",
    }
  }

  let createdProduct

  try {
    createdProduct = await createCatalogProduct(parsed.data)
  } catch (error) {
    if (error instanceof CatalogMutationError) {
      return getCatalogErrorState(error)
    }

    console.error("Produk gagal dibuat.", error)
    return { message: "Produk belum disimpan. Coba lagi." }
  }

  revalidatePath("/admin/produk")
  redirect(`/admin/produk/${createdProduct.id}`)
}

export async function updateProduct(
  productId: string,
  _previousState: ProductFormState,
  formData: FormData
): Promise<ProductFormState> {
  await requireAdmin("/admin/produk")

  const parsedId = productIdSchema.safeParse(productId)
  const parsed = readProductForm(formData)

  if (!parsedId.success) {
    return { message: "Produk tidak ditemukan. Kembali ke daftar produk." }
  }

  if (!parsed.success) {
    return {
      errors: parsed.error.flatten().fieldErrors,
      message: "Periksa kolom yang ditandai.",
    }
  }

  try {
    await updateCatalogProduct({ productId: parsedId.data, ...parsed.data })
  } catch (error) {
    if (error instanceof CatalogMutationError) {
      return getCatalogErrorState(error)
    }

    console.error("Produk gagal diperbarui.", error)
    return { message: "Perubahan belum disimpan. Coba lagi." }
  }

  revalidatePath("/admin/produk")
  revalidatePath(`/admin/produk/${parsedId.data}`)

  return { success: "Informasi produk sudah diperbarui." }
}

export async function changeProductStatus(
  productId: string,
  _previousState: ProductLifecycleState,
  formData: FormData
): Promise<ProductLifecycleState> {
  await requireAdmin("/admin/produk")

  const parsed = productLifecycleActionSchema.safeParse({
    productId,
    intent: formData.get("intent"),
  })

  if (!parsed.success) {
    return { message: "Status belum diubah. Muat ulang halaman, lalu coba lagi." }
  }

  const { intent } = parsed.data

  try {
    switch (intent) {
      case "publish":
        await publishCatalogProduct(parsed.data.productId)
        break
      case "archive":
        await archiveCatalogProduct(parsed.data.productId)
        break
      case "restore":
        await restoreCatalogProduct(parsed.data.productId)
        break
    }
  } catch (error) {
    if (error instanceof CatalogMutationError) {
      return { intent, message: error.message }
    }

    console.error("Status produk gagal diubah.", error)
    return { intent, message: "Status belum diubah. Coba lagi." }
  }

  revalidatePath("/admin/produk")
  revalidatePath(`/admin/produk/${parsed.data.productId}`)

  const successMessages = {
    publish: "Produk diterbitkan.",
    archive: "Produk diarsipkan.",
    restore: "Produk dikembalikan ke draf.",
  } as const

  return { intent, success: successMessages[intent] }
}
