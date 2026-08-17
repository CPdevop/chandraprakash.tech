const { sql } = require("../lib/db");
const { sendJson } = require("../lib/utils");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Method not allowed" });
  }
  try {
    var rows = await sql`
      SELECT slug, title, category, summary, tech_tags, github_url, published_at
      FROM portfolio_items WHERE status = 'published'
      ORDER BY published_at DESC
    `;
    return sendJson(res, 200, { items: rows });
  } catch (err) {
    console.error("portfolio list failed", err);
    return sendJson(res, 500, { error: "Something went wrong loading portfolio items." });
  }
};
