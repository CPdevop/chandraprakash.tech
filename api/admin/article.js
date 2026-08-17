const { sql } = require("../../lib/db");
const { isAdminRequest, cleanText, slugify, sendJson } = require("../../lib/utils");

module.exports = async function handler(req, res) {
  if (!isAdminRequest(req)) return sendJson(res, 401, { error: "Unauthorized" });

  var id = req.query.id || (req.body && req.body.id);
  if (!id) return sendJson(res, 400, { error: "Missing id" });

  if (req.method === "GET") {
    try {
      var rows = await sql`SELECT * FROM articles WHERE id = ${id}`;
      if (!rows.length) return sendJson(res, 404, { error: "Not found" });
      return sendJson(res, 200, { article: rows[0] });
    } catch (err) {
      console.error("admin/article GET failed", err);
      return sendJson(res, 500, { error: "Something went wrong loading that article." });
    }
  }

  if (req.method === "PUT") {
    var body = req.body || {};
    var title = cleanText(body.title, 200);
    if (!title) return sendJson(res, 400, { error: "Title is required." });

    var slug = slugify(body.slug || title);
    var dek = cleanText(body.dek, 300);
    var category = cleanText(body.category, 100);
    var bodyMarkdown = typeof body.bodyMarkdown === "string" ? body.bodyMarkdown : "";
    var coverImageUrl = cleanText(body.coverImageUrl, 2000);
    var status = body.status === "published" ? "published" : "draft";

    try {
      var existing = await sql`SELECT status, published_at FROM articles WHERE id = ${id}`;
      if (!existing.length) return sendJson(res, 404, { error: "Not found" });

      var slugTaken = await sql`SELECT id FROM articles WHERE slug = ${slug} AND id != ${id}`;
      if (slugTaken.length) return sendJson(res, 409, { error: "That slug is already taken by another article." });

      var publishedAt = existing[0].published_at;
      if (status === "published" && !publishedAt) publishedAt = new Date().toISOString();

      await sql`
        UPDATE articles SET
          slug = ${slug}, title = ${title}, dek = ${dek}, category = ${category},
          body_markdown = ${bodyMarkdown}, cover_image_url = ${coverImageUrl || null},
          status = ${status}, published_at = ${publishedAt}, updated_at = now()
        WHERE id = ${id}
      `;
      return sendJson(res, 200, { ok: true, slug: slug });
    } catch (err) {
      console.error("admin/article PUT failed", err);
      return sendJson(res, 500, { error: "Something went wrong saving that article." });
    }
  }

  if (req.method === "DELETE") {
    try {
      await sql`DELETE FROM articles WHERE id = ${id}`;
      return sendJson(res, 200, { ok: true });
    } catch (err) {
      console.error("admin/article DELETE failed", err);
      return sendJson(res, 500, { error: "Something went wrong deleting that article." });
    }
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  return sendJson(res, 405, { error: "Method not allowed" });
};
