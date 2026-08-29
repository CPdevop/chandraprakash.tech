// Generates sitemap.xml dynamically from the database, so every article and
// portfolio item published through the CMS is automatically included —
// nothing to remember to update by hand. Served at /sitemap.xml via the
// vercel.json rewrite (the static file that used to live there is gone).

const { sql } = require("../lib/db");

const STATIC_URLS = [
  { loc: "/", changefreq: "monthly", priority: "1.0" },
  { loc: "/hire/", changefreq: "monthly", priority: "0.9" },
  { loc: "/blog/", changefreq: "weekly", priority: "0.8" },
  { loc: "/questions/", changefreq: "weekly", priority: "0.6" },
];

function urlEntry(loc, lastmod, changefreq, priority) {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

module.exports = async function handler(req, res) {
  const base = "https://www.chandraprakash.tech";
  const today = new Date().toISOString().slice(0, 10);

  try {
    const [articles, items] = await Promise.all([
      sql`SELECT slug, updated_at FROM articles WHERE status = 'published' ORDER BY published_at DESC`,
      sql`SELECT slug, updated_at FROM portfolio_items WHERE status = 'published' ORDER BY published_at DESC`,
    ]);

    const entries = [];
    STATIC_URLS.forEach((u) => entries.push(urlEntry(base + u.loc, today, u.changefreq, u.priority)));
    articles.forEach((a) => entries.push(urlEntry(`${base}/blog/${a.slug}/`, new Date(a.updated_at).toISOString().slice(0, 10), "monthly", "0.7")));
    items.forEach((i) => entries.push(urlEntry(`${base}/work/${i.slug}/`, new Date(i.updated_at).toISOString().slice(0, 10), "monthly", "0.6")));

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;

    res.status(200);
    res.setHeader("Content-Type", "application/xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.end(xml);
  } catch (err) {
    console.error("sitemap generation failed", err);
    res.status(500);
    res.setHeader("Content-Type", "text/plain");
    return res.end("Sitemap temporarily unavailable");
  }
};
