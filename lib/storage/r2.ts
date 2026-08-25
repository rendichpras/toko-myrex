import "server-only"

import {
  CopyObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

import { getStorageConfig } from "@/lib/storage/config"

let cachedClient: S3Client | undefined

function getClient() {
  if (cachedClient) {
    return cachedClient
  }

  const config = getStorageConfig()

  cachedClient = new S3Client({
    region: "auto",
    endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  })

  return cachedClient
}

export type StorageBucket = "media" | "private"

function getBucketName(bucket: StorageBucket) {
  const config = getStorageConfig()
  return bucket === "media" ? config.mediaBucket : config.privateBucket
}

export async function createPresignedUpload({
  key,
  contentType,
}: {
  key: string
  contentType: string
}) {
  const config = getStorageConfig()
  const command = new PutObjectCommand({
    Bucket: config.privateBucket,
    Key: key,
    ContentType: contentType,
  })

  return getSignedUrl(getClient(), command, {
    expiresIn: config.uploadExpiresSeconds,
  })
}

export function headObject(bucket: StorageBucket, key: string) {
  return getClient().send(
    new HeadObjectCommand({ Bucket: getBucketName(bucket), Key: key })
  )
}

export function getObject(bucket: StorageBucket, key: string) {
  return getClient().send(
    new GetObjectCommand({ Bucket: getBucketName(bucket), Key: key })
  )
}

export function putObject(
  bucket: StorageBucket,
  key: string,
  body: Uint8Array,
  contentType: string
) {
  return getClient().send(
    new PutObjectCommand({
      Bucket: getBucketName(bucket),
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
}

export function deleteObject(bucket: StorageBucket, key: string) {
  return getClient().send(
    new DeleteObjectCommand({ Bucket: getBucketName(bucket), Key: key })
  )
}

export function copyPrivateObject(
  sourceKey: string,
  targetBucket: StorageBucket,
  targetKey: string
) {
  const config = getStorageConfig()
  const source = `${config.privateBucket}/${sourceKey}`
    .split("/")
    .map(encodeURIComponent)
    .join("/")

  return getClient().send(
    new CopyObjectCommand({
      Bucket: getBucketName(targetBucket),
      Key: targetKey,
      CopySource: source,
    })
  )
}
