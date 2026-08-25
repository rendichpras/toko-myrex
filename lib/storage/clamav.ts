import "server-only"

import { once } from "node:events"
import { createConnection } from "node:net"

import { getAssetScannerConfig } from "@/lib/storage/config"
import {
  parseClamAvResponse,
  type MalwareScanResult,
} from "@/lib/storage/clamav-protocol"

async function writeSocket(
  socket: ReturnType<typeof createConnection>,
  data: Uint8Array
) {
  if (!socket.write(data)) {
    await once(socket, "drain")
  }
}

export async function scanChunksForMalware(
  chunks: AsyncIterable<Uint8Array>,
  onChunk: (chunk: Uint8Array) => void
): Promise<MalwareScanResult> {
  const config = getAssetScannerConfig()
  const socket = createConnection({ host: config.host, port: config.port })
  const responseChunks: Buffer[] = []

  socket.setTimeout(config.timeoutMs, () => {
    socket.destroy(new Error("Pemindaian malware melewati batas waktu."))
  })

  socket.on("data", (chunk: Buffer) => responseChunks.push(chunk))

  try {
    await once(socket, "connect")
    await writeSocket(socket, Buffer.from("zINSTREAM\0"))

    for await (const value of chunks) {
      const chunk = value instanceof Uint8Array ? value : new Uint8Array(value)
      const length = Buffer.allocUnsafe(4)
      length.writeUInt32BE(chunk.byteLength)
      onChunk(chunk)
      await writeSocket(socket, length)
      await writeSocket(socket, chunk)
    }

    await writeSocket(socket, Buffer.alloc(4))
    socket.end()
    await once(socket, "close")
  } catch (error) {
    socket.destroy()
    throw error
  }

  return parseClamAvResponse(Buffer.concat(responseChunks).toString("utf8"))
}
