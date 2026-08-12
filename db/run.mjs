// ═══════════════════════════════════════════════════════════════════════════════════
// Migration runner for the Sandbox's Fabric SQL Database.
//
//   node run.mjs migrations   — apply db/migrations/*.sql   (portable, any environment)
//   node run.mjs bootstrap    — apply db/bootstrap/*.sql    (environment-specific)
//
// Connects as the ADMIN principal, the only one with DDL rights. Everything it applies
// is recorded in dbo.schema_migration with a checksum, so an already-applied migration
// that has since been edited fails the run rather than silently diverging from what the
// database actually contains — the same "verify, don't assume" rule the schema enforces
// on component work, applied to the schema itself.
//
// Deliberately no explicit transaction around each file: Fabric SQL's support for DDL
// inside an explicit transaction is not something to assume, and a failed run on a
// half-applied migration is a visible, fixable state. The checksum guard is what keeps
// that honest — a partially-applied file is never recorded as done.
// ═══════════════════════════════════════════════════════════════════════════════════

import { createHash } from "node:crypto"
import { readdir, readFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import sql from "mssql"

const HERE = dirname(fileURLToPath(import.meta.url))
process.loadEnvFile(join(HERE, "..", ".env"))

const dir = process.argv[2]
if (dir !== "migrations" && dir !== "bootstrap") {
  console.error("usage: node run.mjs <migrations|bootstrap>")
  process.exit(1)
}

const required = [
  "FABRIC_SQL_SERVER",
  "FABRIC_SQL_DATABASE",
  "FABRIC_TENANT_ID",
  "FABRIC_ADMIN_CLIENT_ID",
  "FABRIC_ADMIN_CLIENT_SECRET",
]
const missing = required.filter((k) => !process.env[k])
if (missing.length) {
  console.error(`Missing in .env: ${missing.join(", ")}`)
  process.exit(1)
}

const config = {
  server: process.env.FABRIC_SQL_SERVER.split(",")[0],
  port: 1433,
  database: process.env.FABRIC_SQL_DATABASE,
  authentication: {
    type: "azure-active-directory-service-principal-secret",
    options: {
      clientId: process.env.FABRIC_ADMIN_CLIENT_ID,
      clientSecret: process.env.FABRIC_ADMIN_CLIENT_SECRET,
      tenantId: process.env.FABRIC_TENANT_ID,
    },
  },
  options: { encrypt: true, trustServerCertificate: false },
  connectionTimeout: 60_000,
  requestTimeout: 120_000,
}

// mssql sends whole strings to the server; `GO` is a client-side batch separator that
// the server does not understand. Split on lines containing only GO.
const splitBatches = (text) =>
  text
    .split(/^\s*GO\s*$/gim)
    .map((b) => b.trim())
    .filter(Boolean)

const sha256 = (text) => createHash("sha256").update(text, "utf8").digest("hex")

let pool
try {
  console.log(`Connecting to ${config.database} as admin…`)
  pool = await sql.connect(config)
  console.log("Connected.\n")

  await pool.request().query(`
    IF OBJECT_ID('dbo.schema_migration', 'U') IS NULL
      CREATE TABLE dbo.schema_migration (
        filename    NVARCHAR(200) NOT NULL CONSTRAINT pk_schema_migration PRIMARY KEY,
        checksum    CHAR(64)      NOT NULL,
        applied_at  DATETIME2(3)  NOT NULL CONSTRAINT df_schema_migration_at DEFAULT SYSUTCDATETIME(),
        applied_by  NVARCHAR(128) NOT NULL CONSTRAINT df_schema_migration_by DEFAULT SUSER_SNAME()
      );`)

  const applied = new Map(
    (await pool.request().query("SELECT filename, checksum FROM dbo.schema_migration"))
      .recordset.map((r) => [r.filename, r.checksum]),
  )

  const files = (await readdir(join(HERE, dir))).filter((f) => f.endsWith(".sql")).sort()
  if (!files.length) {
    console.log(`No .sql files in ${dir}/.`)
  }

  let ran = 0
  for (const file of files) {
    const key = `${dir}/${file}`
    const text = await readFile(join(HERE, dir, file), "utf8")
    const sum = sha256(text)

    if (applied.has(key)) {
      if (applied.get(key) !== sum) {
        throw new Error(
          `${key} was already applied, but its contents have changed since.\n` +
            `  applied checksum: ${applied.get(key)}\n` +
            `  current checksum: ${sum}\n` +
            `An applied migration is a record of what the database actually contains. ` +
            `Add a new migration instead of editing this one.`,
        )
      }
      console.log(`  skip  ${key}`)
      continue
    }

    const batches = splitBatches(text)
    process.stdout.write(`  apply ${key} (${batches.length} batches)… `)
    for (const [i, batch] of batches.entries()) {
      try {
        await pool.request().batch(batch)
      } catch (err) {
        console.log("FAILED")
        throw new Error(`${key}, batch ${i + 1}/${batches.length}:\n${err.message}`)
      }
    }

    await pool
      .request()
      .input("filename", sql.NVarChar(200), key)
      .input("checksum", sql.Char(64), sum)
      .query("INSERT INTO dbo.schema_migration (filename, checksum) VALUES (@filename, @checksum)")

    console.log("ok")
    ran++
  }

  console.log(`\n${ran} applied, ${files.length - ran} already present.`)
} catch (err) {
  console.error(`\nERROR: ${err.message}`)
  process.exitCode = 1
} finally {
  await pool?.close()
}
