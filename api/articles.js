const { sql } = require("../lib/db");
const { sendJson } = require("../lib/utils");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Method not allowed" });
  }
  try {
    var rows = await sql`
      SELECT slug, title, dek, category, published_at
      FROM articles WHERE status = 'published'
      ORDER BY published_at DESC
    `;
    return sendJson(res, 200, { articles: rows });
  } catch (err) {
    console.error("articles list failed", err);
    return sendJson(res, 500, { error: "Something went wrong loading articles." });
  }
};
