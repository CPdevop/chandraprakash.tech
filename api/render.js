// Consolidated SSR renderer for CMS articles and portfolio items. Only ever
// hit via the vercel.json rewrites from /blog/:slug/ and /work/:slug/ — not
// called directly by any frontend code.

const { sql } = require("../lib/db");
const { renderMarkdown } = require("../lib/markdown");
const { renderArticlePage, renderPortfolioPage, renderNotFoundPage } = require("../lib/page-template");

module.exports = async function handler(req, res) {
  var kind = req.query.kind;
  var slug = req.query.slug;

  if (!slug || (kind !== "article" && kind !== "portfolio")) {
    res.status(404);
    res.setHeader("Content-Type", "text/html");
    return res.end(renderNotFoundPage("page"));
  }

  try {
    if (kind === "article") {
      var rows = await sql`SELECT * FROM articles WHERE slug = ${slug} AND status = 'published' LIMIT 1`;
      if (!rows.length) {
        res.status(404); res.setHeader("Content-Type", "text/html");
        return res.end(renderNotFoundPage("article"));
      }
      var article = rows[0];
      article.bodyHtml = renderMarkdown(article.body_markdown);

      // "Next article" nav: cyclical order over all published articles by id.
      var all = await sql`SELECT id, slug, title FROM articles WHERE status = 'published' ORDER BY id ASC`;
      if (all.length > 1) {
        var idx = all.findIndex(function (a) { return a.id === article.id; });
        var next = all[(idx + 1) % all.length];
        article.nextArticle = { slug: next.slug, title: next.title };
      }

      res.status(200); res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.end(renderArticlePage(article));
    }

    var itemRows = await sql`SELECT * FROM portfolio_items WHERE slug = ${slug} AND status = 'published' LIMIT 1`;
    if (!itemRows.length) {
      res.status(404); res.setHeader("Content-Type", "text/html");
      return res.end(renderNotFoundPage("project"));
    }
    var item = itemRows[0];
    item.bodyHtml = renderMarkdown(item.body_markdown);
    res.status(200); res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(renderPortfolioPage(item));
  } catch (err) {
    console.error("render failed", err);
    res.status(500); res.setHeader("Content-Type", "text/html");
    return res.end(renderNotFoundPage("page"));
  }
};
