export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`
  }

  if (bytes < 1024 * 1024) {
    return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(bytes / 1024)} KB`
  }

  return `${new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`
}
