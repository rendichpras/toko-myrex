import "@/lib/env-config"

import { cleanupCatalogUploads } from "@/lib/catalog/upload-cleanup"

const minimumAgeHours = Number(process.env.UPLOAD_CLEANUP_MIN_AGE_HOURS ?? "24")
const dryRun = process.argv.includes("--dry-run")

try {
  const result = await cleanupCatalogUploads({ dryRun, minimumAgeHours })
  console.info(
    result.dryRun
      ? `Dry run selesai: ${result.candidates} objek akan dihapus.`
      : `Cleanup selesai: ${result.deleted}/${result.candidates} objek dihapus.`
  )

  if (result.failures.length > 0) {
    for (const failure of result.failures) {
      console.error(`Objek gagal dihapus: ${failure.key}`, failure.reason)
    }

    process.exitCode = 1
  }
} catch (error) {
  console.error("Cleanup unggahan gagal.", error)
  process.exitCode = 1
}
