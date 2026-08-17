const { sql } = require("../lib/db");
const { renderMarkdown } = require("../lib/markdown");
const { renderPortfolioPage, renderNotFoundPage } = require("../lib/page-template");

module.exports = async function handler(req, res) {
  var slug = req.query.slug;
  if (!slug) {
    res.status(404);
    res.setHeader("Content-Type", "text/html");
    return res.end(renderNotFoundPage("project"));
  }

  try {
    var rows = await sql`SELECT * FROM portfolio_items WHERE slug = ${slug} AND status = 'published' LIMIT 1`;
    if (!rows.length) {
      res.status(404);
      res.setHeader("Content-Type", "text/html");
      return res.end(renderNotFoundPage("project"));
    }

    var item = rows[0];
    item.bodyHtml = renderMarkdown(item.body_markdown);

    res.status(200);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.end(renderPortfolioPage(item));
  } catch (err) {
    console.error("portfolio render failed", err);
    res.status(500);
    res.setHeader("Content-Type", "text/html");
    return res.end(renderNotFoundPage("project"));
  }
};
