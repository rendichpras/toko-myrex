import "server-only"

export {
  getProductAssetMaxBytes,
  getPublicMediaUrl,
  isStorageConfigured,
} from "@/lib/storage/config"
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
