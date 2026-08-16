// Shared Neon client for serverless functions.
// Uses the HTTP-based driver — one query per request, no connection pool to
// manage across cold starts, which is what you want in a serverless function.

const { neon } = require("@neondatabase/serverless");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set. Add it to .env locally and to the Vercel project's Environment Variables for production.");
}

const sql = neon(process.env.DATABASE_URL);

module.exports = { sql };
