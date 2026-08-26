import type { MetadataRoute } from "next"
import { connection } from "next/server"

import { resolveAuthBaseUrl } from "@/lib/auth/origin"
import { listPublicProductSitemapEntries } from "@/lib/catalog/public-data"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection()

  const origin = resolveAuthBaseUrl(process.env.BETTER_AUTH_URL)
  const products = await listPublicProductSitemapEntries()

  return [
    {
      url: origin,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...products.map((product) => ({
      url: `${origin}/produk/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ]
}
