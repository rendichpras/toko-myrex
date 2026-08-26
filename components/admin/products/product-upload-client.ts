"use client"

export type ProductUploadKind = "cover" | "asset"

export function uploadFileToStorage(
  url: string,
  file: File,
  contentType: string,
  onProgress: (progress: number) => void
) {
  return new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest()

    request.open("PUT", url)
    request.setRequestHeader("Content-Type", contentType)
    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    })
    request.addEventListener("load", () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(100)
        resolve()
        return
      }

      reject(new Error("Penyimpanan menolak unggahan."))
    })
    request.addEventListener("error", () => {
      reject(new Error("Browser tidak dapat menghubungi penyimpanan."))
    })
    request.addEventListener("abort", () => {
      reject(new Error("Unggahan dibatalkan."))
    })
    request.send(file)
  })
}
