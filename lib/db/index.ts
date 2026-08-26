import "server-only"

import { drizzle } from "drizzle-orm/node-postgres"
import type { Pool } from "pg"

import { createDatabasePool } from "@/lib/db/pool"
import * as schema from "@/lib/db/schema/index"

const globalForDatabase = globalThis as typeof globalThis & {
  DatabasePool?: Pool
}

const pool =
  globalForDatabase.DatabasePool ?? createDatabasePool()

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.DatabasePool = pool
}

export const db = drizzle({ client: pool, schema })
