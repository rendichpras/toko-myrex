import "server-only"

export {
  getAssetScannerConfig,
  getProductAssetMaxBytes,
  getPublicMediaUrl,
  isAssetScannerConfigured,
  isStorageConfigured,
} from "@/lib/storage/config"
export { scanChunksForMalware } from "@/lib/storage/clamav"
export {
  copyPrivateObject,
  createPresignedUpload,
  deleteObject,
  getObject,
  headObject,
  listObjects,
  putObject,
} from "@/lib/storage/r2"
export type { StorageBucket } from "@/lib/storage/r2"
