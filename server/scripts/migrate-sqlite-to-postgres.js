// One-time copy of the old local SQLite database (prisma/dev.db) into PostgreSQL.
// Keeps all IDs, orders, admin users and any menu edits.
//
//   DATABASE_URL=postgresql://... npm run db:migrate-sqlite [-- path/to/dev.db] [-- --force]
//
// Run `npm run db:push` against the Postgres database first (creates empty tables).
// Refuses to run if Postgres already has data unless --force is given (which empties it first).
// Needs the `sqlite3` command-line tool (preinstalled on macOS).
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'

const here = path.dirname(fileURLToPath(import.meta.url))
const args = process.argv.slice(2)
const force = args.includes('--force')
const sqliteFile = path.resolve(args.find((a) => !a.startsWith('--')) || path.join(here, '../prisma/dev.db'))

// Parents before children so foreign keys are satisfied.
const TABLES = ['restaurants', 'menu_categories', 'menu_items', 'admin_users', 'orders', 'order_items']

if (!fs.existsSync(sqliteFile)) {
  console.error(`SQLite file not found: ${sqliteFile}`)
  process.exit(1)
}

const readTable = (table) => {
  const out = execFileSync('sqlite3', ['-json', sqliteFile, `SELECT * FROM "${table}"`], { encoding: 'utf8', maxBuffer: 1 << 28 })
  return out.trim() ? JSON.parse(out) : []
}

const prisma = new PrismaClient()

async function columnTypes(table) {
  const rows = await prisma.$queryRawUnsafe(
    'SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1',
    table,
  )
  return Object.fromEntries(rows.map((r) => [r.column_name, r.data_type]))
}

// SQLite (via Prisma) stores booleans as 0/1 and dates as epoch milliseconds.
function convert(value, pgType) {
  if (value === null || value === undefined) return null
  if (pgType === 'boolean') return Boolean(Number(value))
  if (pgType.startsWith('timestamp')) return new Date(typeof value === 'number' ? value : Number(value) || value)
  return value
}

async function main() {
  console.log(`Copying ${sqliteFile} → PostgreSQL`)
  const existing = await prisma.restaurant.count()
  if (existing && !force) {
    console.error(`PostgreSQL already has ${existing} restaurants. Re-run with --force to replace all data.`)
    process.exit(1)
  }

  await prisma.$transaction(async (tx) => {
    if (force) await tx.$executeRawUnsafe(`TRUNCATE ${TABLES.map((t) => `"${t}"`).join(', ')} CASCADE`)
    for (const table of TABLES) {
      const rows = readTable(table)
      const types = await columnTypes(table)
      for (const row of rows) {
        const cols = Object.keys(row).filter((c) => c in types)
        const values = cols.map((c) => convert(row[c], types[c]))
        const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ')
        await tx.$executeRawUnsafe(`INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(', ')}) VALUES (${placeholders})`, ...values)
      }
      console.log(`  ✓ ${table}: ${rows.length}`)
    }
  }, { timeout: 120_000 })
  console.log('Done.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
