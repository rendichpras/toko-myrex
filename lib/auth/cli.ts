import "@/lib/env-config"

import { drizzle } from "drizzle-orm/node-postgres"

import { createAuth } from "@/lib/auth/config"
import { createDatabasePool } from "@/lib/db/pool"
import * as schema from "@/lib/db/schema/index"

const pool = createDatabasePool({ allowExitOnIdle: true })
const db = drizzle({ client: pool, schema })

export const auth = createAuth(db)
