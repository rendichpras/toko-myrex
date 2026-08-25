import "@/lib/env-config"

import { drizzle } from "drizzle-orm/node-postgres"

import { createAuth } from "@/lib/auth/config"
import { createDatabasePool } from "@/lib/db/pool"
import * as authSchema from "@/lib/db/schema/auth"

const pool = createDatabasePool({ allowExitOnIdle: true })
const db = drizzle({ client: pool, schema: authSchema })

export const auth = createAuth(db)
