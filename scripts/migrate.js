// One-time (and re-runnable — every statement is IF NOT EXISTS) schema setup.
// Usage: npm run db:migrate   (reads DATABASE_URL from .env in the project root)

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Pool } = require("@neondatabase/serverless");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL is not set. Create a .env file in the project root with:\n\nDATABASE_URL=postgresql://...\n");
    process.exit(1);
  }

  const pool = new Pool({ connectionString: url });
  const schemaPath = path.join(__dirname, "..", "db", "schema.sql");
  const schema = fs
    .readFileSync(schemaPath, "utf8")
    .split("\n")
    .filter((line) => !line.trim().startsWith("--")) // strip full-line comments so a stray ";" in prose can't break statement splitting
    .join("\n");

  // Split on semicolons at statement boundaries; schema.sql has no semicolons inside string literals.
  const statements = schema
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`Running ${statements.length} statements against Neon...`);
  for (const statement of statements) {
    await pool.query(statement);
  }
  await pool.end();
  console.log("Schema is up to date.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
