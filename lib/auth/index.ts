import "server-only"

import { createAuth } from "@/lib/auth/config"
import { db } from "@/lib/db"

export const auth = createAuth(db)
