import "server-only"

import { and, eq, inArray, lt } from "drizzle-orm"

import { db } from "@/lib/db"
import { productAsset, productMedia } from "@/lib/db/schema/index"
import { deleteObject, listObjects, type StorageBucket } from "@/lib/storage"

type StoredObject = {
  bucket: StorageBucket
  key: string
  lastModified: Date
}

async function listAllObjects(bucket: StorageBucket, prefix: string) {
  const objects: StoredObject[] = []
  let continuationToken: string | undefined

  do {
    const page = await listObjects(bucket, prefix, continuationToken)

    for (const object of page.Contents ?? []) {
      if (object.Key && object.LastModified) {
        objects.push({
          bucket,
          key: object.Key,
          lastModified: object.LastModified,
        })
      }
    }

    continuationToken = page.IsTruncated
      ? page.NextContinuationToken
      : undefined
  } while (continuationToken)

  return objects
}

async function deleteStoredObjects(objects: StoredObject[]) {
  let deleted = 0
  const failures: Array<{ key: string; reason: unknown }> = []

  for (const object of objects) {
    try {
      await deleteObject(object.bucket, object.key)
      deleted += 1
    } catch (reason) {
      failures.push({ key: object.key, reason })
    }
  }

  return { deleted, failures }
}

export async function cleanupCatalogUploads({
  dryRun = false,
  minimumAgeHours = 24,
}: {
  dryRun?: boolean
  minimumAgeHours?: number
} = {}) {
  if (!Number.isFinite(minimumAgeHours) || minimumAgeHours < 1) {
    throw new Error("Usia minimum cleanup harus minimal satu jam.")
  }

  const cutoff = new Date(Date.now() - minimumAgeHours * 60 * 60 * 1000)

  const [readyMedia, retainedAssets, stagingObjects, mediaObjects, assetObjects] =
    await Promise.all([
      db
        .select({ key: productMedia.storageKey })
        .from(productMedia)
        .where(eq(productMedia.status, "ready")),
      db
        .select({ key: productAsset.storageKey })
        .from(productAsset)
        .where(inArray(productAsset.status, ["ready", "archived"])),
      listAllObjects("private", "staging/products/"),
      listAllObjects("media", "products/"),
      listAllObjects("private", "products/"),
    ])

  const readyMediaKeys = new Set(readyMedia.map((item) => item.key))
  const retainedAssetKeys = new Set(retainedAssets.map((item) => item.key))
  const expiredStaging = stagingObjects.filter(
    (object) => object.lastModified < cutoff
  )
  const orphanedMedia = mediaObjects.filter(
    (object) =>
      object.lastModified < cutoff && !readyMediaKeys.has(object.key)
  )
  const orphanedAssets = assetObjects.filter(
    (object) =>
      object.lastModified < cutoff && !retainedAssetKeys.has(object.key)
  )

  if (!dryRun) {
    await db.transaction(async (transaction) => {
      await transaction
        .update(productMedia)
        .set({
          status: "archived",
          rejectionReason: "Unggahan kedaluwarsa sebelum selesai.",
          updatedAt: new Date(),
        })
        .where(
          and(
            inArray(productMedia.status, ["pending", "rejected"]),
            lt(productMedia.updatedAt, cutoff)
          )
        )

      await transaction
        .update(productAsset)
        .set({
          status: "archived",
          rejectionReason: "Unggahan kedaluwarsa sebelum selesai.",
          updatedAt: new Date(),
        })
        .where(
          and(
            inArray(productAsset.status, ["pending", "rejected"]),
            lt(productAsset.updatedAt, cutoff)
          )
        )
    })
  }

  const candidates = [
    ...expiredStaging,
    ...orphanedMedia,
    ...orphanedAssets,
  ]
  const deletion = dryRun
    ? { deleted: 0, failures: [] }
    : await deleteStoredObjects(candidates)

  return {
    cutoff: cutoff.toISOString(),
    candidates: candidates.length,
    dryRun,
    deleted: deletion.deleted,
    failures: deletion.failures,
  }
}
