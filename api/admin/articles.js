const { sql } = require("../../lib/db");
const { isAdminRequest, cleanText, slugify, sendJson } = require("../../lib/utils");

module.exports = async function handler(req, res) {
  if (!isAdminRequest(req)) return sendJson(res, 401, { error: "Unauthorized" });

  if (req.method === "GET") {
    try {
      var rows = await sql`
        SELECT id, slug, title, dek, category, status, created_at, updated_at, published_at
        FROM articles ORDER BY updated_at DESC
      `;
      return sendJson(res, 200, { articles: rows });
    } catch (err) {
      console.error("admin/articles GET failed", err);
      return sendJson(res, 500, { error: "Something went wrong loading articles." });
    }
  }

  if (req.method === "POST") {
    var body = req.body || {};
    var title = cleanText(body.title, 200);
    if (!title) return sendJson(res, 400, { error: "Title is required." });

    var slug = slugify(body.slug || title);
    if (!slug) return sendJson(res, 400, { error: "Couldn't derive a slug from that title." });

    var dek = cleanText(body.dek, 300);
    var category = cleanText(body.category, 100);
    var bodyMarkdown = typeof body.bodyMarkdown === "string" ? body.bodyMarkdown : "";
    var coverImageUrl = cleanText(body.coverImageUrl, 2000);
    var status = body.status === "published" ? "published" : "draft";
    var publishedAt = status === "published" ? new Date().toISOString() : null;

    try {
      var existing = await sql`SELECT id FROM articles WHERE slug = ${slug}`;
      if (existing.length) return sendJson(res, 409, { error: "That slug is already taken. Choose a different one." });

      var rows = await sql`
        INSERT INTO articles (slug, title, dek, category, body_markdown, cover_image_url, status, published_at)
        VALUES (${slug}, ${title}, ${dek}, ${category}, ${bodyMarkdown}, ${coverImageUrl || null}, ${status}, ${publishedAt})
        RETURNING id, slug
      `;
      return sendJson(res, 201, { ok: true, id: rows[0].id, slug: rows[0].slug });
    } catch (err) {
      console.error("admin/articles POST failed", err);
      return sendJson(res, 500, { error: "Something went wrong creating that article." });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return sendJson(res, 405, { error: "Method not allowed" });
};
