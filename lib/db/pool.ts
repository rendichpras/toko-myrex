import { Pool } from "pg"

type DatabasePoolOptions = {
  allowExitOnIdle?: boolean
}

const maximumTimerDurationMs = 2_147_483_647

function readPositiveIntegerSetting(
  name: string,
  fallback: number,
  maximum = Number.MAX_SAFE_INTEGER
) {
  const value = process.env[name]

  if (value === undefined) {
    return fallback
  }

  const parsed = Number(value)

  if (!Number.isSafeInteger(parsed) || parsed <= 0 || parsed > maximum) {
    throw new Error(
      `${name} harus berupa bilangan bulat antara 1 dan ${maximum}.`
    )
  }

  return parsed
}

export function createDatabasePool({
  allowExitOnIdle = false,
}: DatabasePoolOptions = {}) {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error("DATABASE_URL belum dikonfigurasi.")
  }

  const pool = new Pool({
    connectionString,
    max: readPositiveIntegerSetting("DATABASE_POOL_MAX", 10),
    idleTimeoutMillis: readPositiveIntegerSetting(
      "DATABASE_POOL_IDLE_TIMEOUT_MS",
      10_000,
      maximumTimerDurationMs
    ),
    connectionTimeoutMillis: readPositiveIntegerSetting(
      "DATABASE_POOL_CONNECTION_TIMEOUT_MS",
      5_000,
      maximumTimerDurationMs
    ),
    allowExitOnIdle,
  })

  pool.on("error", (error) => {
    console.error("Koneksi PostgreSQL idle mengalami kegagalan.", error)
  })

  return pool
}
