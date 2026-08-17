// Consolidated admin CRUD for articles and portfolio items. Original URLs
// (/api/admin/articles, /api/admin/article, /api/admin/portfolio,
// /api/admin/portfolio-item) are preserved via vercel.json rewrites.

const { sql } = require("../../lib/db");
const { isAdminRequest, cleanText, slugify, sendJson } = require("../../lib/utils");

module.exports = async function handler(req, res) {
  if (!isAdminRequest(req)) return sendJson(res, 401, { error: "Unauthorized" });

  switch (req.query.resource) {
    case "articles": return articlesHandler(req, res);
    case "article": return articleHandler(req, res);
    case "portfolio-list": return portfolioListHandler(req, res);
    case "portfolio-item": return portfolioItemHandler(req, res);
    default: return sendJson(res, 404, { error: "Unknown resource" });
  }
};

/* ---------- articles: list + create ---------- */
async function articlesHandler(req, res) {
  if (req.method === "GET") {
    try {
      var rows = await sql`SELECT id, slug, title, dek, category, status, created_at, updated_at, published_at FROM articles ORDER BY updated_at DESC`;
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
}

/* ---------- article: single get/update/delete ---------- */
async function articleHandler(req, res) {
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
        UPDATE articles SET slug = ${slug}, title = ${title}, dek = ${dek}, category = ${category},
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
}

/* ---------- portfolio: list + create ---------- */
async function portfolioListHandler(req, res) {
  if (req.method === "GET") {
    try {
      var rows = await sql`SELECT id, slug, title, category, summary, status, created_at, updated_at, published_at FROM portfolio_items ORDER BY updated_at DESC`;
      return sendJson(res, 200, { items: rows });
    } catch (err) {
      console.error("admin/portfolio GET failed", err);
      return sendJson(res, 500, { error: "Something went wrong loading portfolio items." });
    }
  }

  if (req.method === "POST") {
    var body = req.body || {};
    var title = cleanText(body.title, 200);
    if (!title) return sendJson(res, 400, { error: "Title is required." });
    var slug = slugify(body.slug || title);
    if (!slug) return sendJson(res, 400, { error: "Couldn't derive a slug from that title." });

    var category = cleanText(body.category, 100);
    var summary = cleanText(body.summary, 300);
    var bodyMarkdown = typeof body.bodyMarkdown === "string" ? body.bodyMarkdown : "";
    var techTags = cleanText(body.techTags, 300);
    var githubUrl = cleanText(body.githubUrl, 500);
    var coverImageUrl = cleanText(body.coverImageUrl, 2000);
    var status = body.status === "published" ? "published" : "draft";
    var publishedAt = status === "published" ? new Date().toISOString() : null;

    try {
      var existing = await sql`SELECT id FROM portfolio_items WHERE slug = ${slug}`;
      if (existing.length) return sendJson(res, 409, { error: "That slug is already taken. Choose a different one." });

      var rows = await sql`
        INSERT INTO portfolio_items (slug, title, category, summary, body_markdown, tech_tags, github_url, cover_image_url, status, published_at)
        VALUES (${slug}, ${title}, ${category}, ${summary}, ${bodyMarkdown}, ${techTags}, ${githubUrl || null}, ${coverImageUrl || null}, ${status}, ${publishedAt})
        RETURNING id, slug
      `;
      return sendJson(res, 201, { ok: true, id: rows[0].id, slug: rows[0].slug });
    } catch (err) {
      console.error("admin/portfolio POST failed", err);
      return sendJson(res, 500, { error: "Something went wrong creating that item." });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return sendJson(res, 405, { error: "Method not allowed" });
}

/* ---------- portfolio item: single get/update/delete ---------- */
async function portfolioItemHandler(req, res) {
  var id = req.query.id || (req.body && req.body.id);
  if (!id) return sendJson(res, 400, { error: "Missing id" });

  if (req.method === "GET") {
    try {
      var rows = await sql`SELECT * FROM portfolio_items WHERE id = ${id}`;
      if (!rows.length) return sendJson(res, 404, { error: "Not found" });
      return sendJson(res, 200, { item: rows[0] });
    } catch (err) {
      console.error("admin/portfolio-item GET failed", err);
      return sendJson(res, 500, { error: "Something went wrong loading that item." });
    }
  }

  if (req.method === "PUT") {
    var body = req.body || {};
    var title = cleanText(body.title, 200);
    if (!title) return sendJson(res, 400, { error: "Title is required." });
    var slug = slugify(body.slug || title);
    var category = cleanText(body.category, 100);
    var summary = cleanText(body.summary, 300);
    var bodyMarkdown = typeof body.bodyMarkdown === "string" ? body.bodyMarkdown : "";
    var techTags = cleanText(body.techTags, 300);
    var githubUrl = cleanText(body.githubUrl, 500);
    var coverImageUrl = cleanText(body.coverImageUrl, 2000);
    var status = body.status === "published" ? "published" : "draft";

    try {
      var existing = await sql`SELECT status, published_at FROM portfolio_items WHERE id = ${id}`;
      if (!existing.length) return sendJson(res, 404, { error: "Not found" });
      var slugTaken = await sql`SELECT id FROM portfolio_items WHERE slug = ${slug} AND id != ${id}`;
      if (slugTaken.length) return sendJson(res, 409, { error: "That slug is already taken by another item." });

      var publishedAt = existing[0].published_at;
      if (status === "published" && !publishedAt) publishedAt = new Date().toISOString();

      await sql`
        UPDATE portfolio_items SET slug = ${slug}, title = ${title}, category = ${category}, summary = ${summary},
          body_markdown = ${bodyMarkdown}, tech_tags = ${techTags}, github_url = ${githubUrl || null},
          cover_image_url = ${coverImageUrl || null}, status = ${status}, published_at = ${publishedAt}, updated_at = now()
        WHERE id = ${id}
      `;
      return sendJson(res, 200, { ok: true, slug: slug });
    } catch (err) {
      console.error("admin/portfolio-item PUT failed", err);
      return sendJson(res, 500, { error: "Something went wrong saving that item." });
    }
  }

  if (req.method === "DELETE") {
    try {
      await sql`DELETE FROM portfolio_items WHERE id = ${id}`;
      return sendJson(res, 200, { ok: true });
    } catch (err) {
      console.error("admin/portfolio-item DELETE failed", err);
      return sendJson(res, 500, { error: "Something went wrong deleting that item." });
    }
  }

  res.setHeader("Allow", "GET, PUT, DELETE");
  return sendJson(res, 405, { error: "Method not allowed" });
}
