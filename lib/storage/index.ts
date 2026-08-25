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
  putObject,
} from "@/lib/storage/r2"
