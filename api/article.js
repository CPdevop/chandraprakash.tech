const { sql } = require("../lib/db");
const { renderMarkdown } = require("../lib/markdown");
const { renderArticlePage, renderNotFoundPage } = require("../lib/page-template");

module.exports = async function handler(req, res) {
  var slug = req.query.slug;
  if (!slug) {
    res.status(404);
    res.setHeader("Content-Type", "text/html");
    return res.end(renderNotFoundPage("article"));
  }

  try {
    var rows = await sql`SELECT * FROM articles WHERE slug = ${slug} AND status = 'published' LIMIT 1`;
    if (!rows.length) {
      res.status(404);
      res.setHeader("Content-Type", "text/html");
      return res.end(renderNotFoundPage("article"));
    }

    var article = rows[0];
    article.bodyHtml = renderMarkdown(article.body_markdown);

    res.status(200);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(renderArticlePage(article));
  } catch (err) {
    console.error("article render failed", err);
    res.status(500);
    res.setHeader("Content-Type", "text/html");
    return res.end(renderNotFoundPage("article"));
  }
};
