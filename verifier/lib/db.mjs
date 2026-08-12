// Shared connection helper. Each principal is a separate identity by design — see
// docs/SANDBOX-SPEC.md §3. Nothing here should ever fall back to a more privileged
// principal when a less privileged one is refused; that refusal is the system working.

import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import sql from "mssql"

const HERE = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = join(HERE, "..", "..")

let loaded = false
export function loadEnv() {
  if (!loaded) {
    process.loadEnvFile(join(REPO_ROOT, ".env"))
    loaded = true
  }
}

/** @param role "ADMIN" | "APP" | "AGENT" | "RUNNER" */
export function connect(role) {
  loadEnv()
  const clientId = process.env[`FABRIC_${role}_CLIENT_ID`]
  const clientSecret = process.env[`FABRIC_${role}_CLIENT_SECRET`]
  if (!clientId || !clientSecret) {
    throw new Error(`Missing FABRIC_${role}_CLIENT_ID / _SECRET in .env`)
  }
  return sql.connect({
    server: process.env.FABRIC_SQL_SERVER.split(",")[0],
    port: 1433,
    database: process.env.FABRIC_SQL_DATABASE,
    authentication: {
      type: "azure-active-directory-service-principal-secret",
      options: { clientId, clientSecret, tenantId: process.env.FABRIC_TENANT_ID },
    },
    options: { encrypt: true, trustServerCertificate: false },
    connectionTimeout: 60_000,
    requestTimeout: 120_000,
  })
}

export { sql }
