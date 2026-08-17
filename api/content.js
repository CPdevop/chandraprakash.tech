// Consolidated public content endpoint — Vercel's Hobby plan caps a
// deployment at 12 Serverless Functions, so every public read/write route
// that isn't SSR lives here, dispatched by ?resource=, with the original
// URLs (/api/comments, /api/questions, etc.) preserved via vercel.json
// rewrites so no frontend code needed to change.

const { sql } = require("../lib/db");
const { getClientIp, isValidEmail, cleanText, isHoneypotTripped, sendJson } = require("../lib/utils");

const COOLDOWN_SECONDS = 60;
const ALLOWED_EMOJI = ["👍", "❤️", "💡", "🔥", "👏"];

module.exports = async function handler(req, res) {
  var resource = req.query.resource;
  switch (resource) {
    case "comments": return commentsHandler(req, res);
    case "questions": return questionsHandler(req, res);
    case "reactions": return reactionsHandler(req, res);
    case "inquiries": return inquiriesHandler(req, res);
    case "articles": return articlesListHandler(req, res);
    case "portfolio": return portfolioListHandler(req, res);
    default: return sendJson(res, 404, { error: "Unknown resource" });
  }
};

/* ---------- comments ---------- */
async function commentsHandler(req, res) {
  if (req.method === "GET") {
    var slug = cleanText(req.query.slug, 200);
    if (!slug) return sendJson(res, 400, { error: "Missing slug" });
    try {
      var rows = await sql`
        SELECT id, name, body, created_at, admin_reply, admin_reply_at, admin_reaction
        FROM comments WHERE post_slug = ${slug} AND status = 'approved'
        ORDER BY created_at ASC
      `;
      return sendJson(res, 200, { comments: rows });
    } catch (err) {
      console.error("comments GET failed", err);
      return sendJson(res, 500, { error: "Something went wrong loading comments." });
    }
  }

  if (req.method === "POST") {
    var body = req.body || {};
    if (isHoneypotTripped(body)) return sendJson(res, 201, { ok: true });

    var postSlug = cleanText(body.slug, 200);
    var name = cleanText(body.name, 100);
    var email = cleanText(body.email, 254);
    var comment = cleanText(body.body, 2000);
    if (!postSlug || !name || !comment) return sendJson(res, 400, { error: "Name and comment are required." });
    if (!isValidEmail(email)) return sendJson(res, 400, { error: "Please enter a valid email address." });

    var ip = getClientIp(req);
    try {
      var recent = await sql`
        SELECT id FROM comments WHERE ip_address = ${ip} AND created_at > now() - (${COOLDOWN_SECONDS} || ' seconds')::interval LIMIT 1
      `;
      if (recent.length > 0) return sendJson(res, 429, { error: "Please wait a moment before submitting another comment." });

      await sql`INSERT INTO comments (post_slug, name, email, body, ip_address) VALUES (${postSlug}, ${name}, ${email}, ${comment}, ${ip})`;
      return sendJson(res, 201, { ok: true, message: "Thanks — your comment has been submitted and will appear once it's reviewed." });
    } catch (err) {
      console.error("comments POST failed", err);
      return sendJson(res, 500, { error: "Something went wrong submitting your comment." });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return sendJson(res, 405, { error: "Method not allowed" });
}

/* ---------- questions ---------- */
async function questionsHandler(req, res) {
  if (req.method === "GET") {
    var slug = cleanText(req.query.slug, 200);
    try {
      var rows = slug
        ? await sql`SELECT id, name, question, answer, created_at, answered_at FROM questions WHERE status = 'answered' AND post_slug = ${slug} ORDER BY answered_at DESC`
        : await sql`SELECT id, name, question, answer, created_at, answered_at FROM questions WHERE status = 'answered' ORDER BY answered_at DESC`;
      return sendJson(res, 200, { questions: rows });
    } catch (err) {
      console.error("questions GET failed", err);
      return sendJson(res, 500, { error: "Something went wrong loading questions." });
    }
  }

  if (req.method === "POST") {
    var body = req.body || {};
    if (isHoneypotTripped(body)) return sendJson(res, 201, { ok: true });

    var postSlug = cleanText(body.slug, 200) || null;
    var name = cleanText(body.name, 100);
    var email = cleanText(body.email, 254);
    var question = cleanText(body.question, 1000);
    if (!name || !question) return sendJson(res, 400, { error: "Name and question are required." });
    if (!isValidEmail(email)) return sendJson(res, 400, { error: "Please enter a valid email address." });

    var ip = getClientIp(req);
    try {
      var recent = await sql`
        SELECT id FROM questions WHERE ip_address = ${ip} AND created_at > now() - (${COOLDOWN_SECONDS} || ' seconds')::interval LIMIT 1
      `;
      if (recent.length > 0) return sendJson(res, 429, { error: "Please wait a moment before submitting another question." });

      await sql`INSERT INTO questions (post_slug, name, email, question, ip_address) VALUES (${postSlug}, ${name}, ${email}, ${question}, ${ip})`;
      return sendJson(res, 201, { ok: true, message: "Thanks — your question has been submitted. It'll appear here once it's answered." });
    } catch (err) {
      console.error("questions POST failed", err);
      return sendJson(res, 500, { error: "Something went wrong submitting your question." });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return sendJson(res, 405, { error: "Method not allowed" });
}

/* ---------- reactions ---------- */
async function getReactionCounts(slug) {
  var rows = await sql`SELECT emoji, COUNT(*)::int AS count FROM post_reactions WHERE post_slug = ${slug} GROUP BY emoji`;
  var counts = {};
  ALLOWED_EMOJI.forEach(function (e) { counts[e] = 0; });
  rows.forEach(function (r) { counts[r.emoji] = r.count; });
  return counts;
}

async function reactionsHandler(req, res) {
  if (req.method === "GET") {
    var slug = cleanText(req.query.slug, 200);
    if (!slug) return sendJson(res, 400, { error: "Missing slug" });
    try {
      var counts = await getReactionCounts(slug);
      var ip = getClientIp(req);
      var mine = await sql`SELECT emoji FROM post_reactions WHERE post_slug = ${slug} AND ip_address = ${ip}`;
      return sendJson(res, 200, { counts: counts, mine: mine.map(function (r) { return r.emoji; }) });
    } catch (err) {
      console.error("reactions GET failed", err);
      return sendJson(res, 500, { error: "Something went wrong loading reactions." });
    }
  }

  if (req.method === "POST") {
    var body = req.body || {};
    var postSlug = cleanText(body.slug, 200);
    var emoji = body.emoji;
    if (!postSlug || !ALLOWED_EMOJI.includes(emoji)) return sendJson(res, 400, { error: "Invalid slug or emoji." });

    var ip = getClientIp(req);
    try {
      var existing = await sql`SELECT id FROM post_reactions WHERE post_slug = ${postSlug} AND emoji = ${emoji} AND ip_address = ${ip}`;
      if (existing.length > 0) {
        await sql`DELETE FROM post_reactions WHERE id = ${existing[0].id}`;
      } else {
        await sql`INSERT INTO post_reactions (post_slug, emoji, ip_address) VALUES (${postSlug}, ${emoji}, ${ip}) ON CONFLICT (post_slug, emoji, ip_address) DO NOTHING`;
      }
      var counts = await getReactionCounts(postSlug);
      var mine = await sql`SELECT emoji FROM post_reactions WHERE post_slug = ${postSlug} AND ip_address = ${ip}`;
      return sendJson(res, 200, { counts: counts, mine: mine.map(function (r) { return r.emoji; }) });
    } catch (err) {
      console.error("reactions POST failed", err);
      return sendJson(res, 500, { error: "Something went wrong saving your reaction." });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return sendJson(res, 405, { error: "Method not allowed" });
}

/* ---------- inquiries ---------- */
async function inquiriesHandler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  var body = req.body || {};
  if (isHoneypotTripped(body)) return sendJson(res, 201, { ok: true });

  var VALID_TYPES = ["freelance", "job", "general"];
  var name = cleanText(body.name, 100);
  var email = cleanText(body.email, 254);
  var message = cleanText(body.message, 3000);
  var inquiryType = VALID_TYPES.includes(body.inquiryType) ? body.inquiryType : "general";
  if (!name || !message) return sendJson(res, 400, { error: "Name and message are required." });
  if (!isValidEmail(email)) return sendJson(res, 400, { error: "Please enter a valid email address." });

  var ip = getClientIp(req);
  try {
    var recent = await sql`
      SELECT id FROM inquiries WHERE ip_address = ${ip} AND created_at > now() - (${COOLDOWN_SECONDS} || ' seconds')::interval LIMIT 1
    `;
    if (recent.length > 0) return sendJson(res, 429, { error: "Please wait a moment before submitting again." });

    await sql`INSERT INTO inquiries (name, email, message, inquiry_type, ip_address) VALUES (${name}, ${email}, ${message}, ${inquiryType}, ${ip})`;
    return sendJson(res, 201, { ok: true, message: "Thanks — I'll get back to you soon." });
  } catch (err) {
    console.error("inquiries POST failed", err);
    return sendJson(res, 500, { error: "Something went wrong submitting your message." });
  }
}

/* ---------- articles / portfolio public lists ---------- */
async function articlesListHandler(req, res) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return sendJson(res, 405, { error: "Method not allowed" }); }
  try {
    var rows = await sql`SELECT slug, title, dek, category, published_at FROM articles WHERE status = 'published' ORDER BY published_at DESC`;
    return sendJson(res, 200, { articles: rows });
  } catch (err) {
    console.error("articles list failed", err);
    return sendJson(res, 500, { error: "Something went wrong loading articles." });
  }
}

async function portfolioListHandler(req, res) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return sendJson(res, 405, { error: "Method not allowed" }); }
  try {
    var rows = await sql`SELECT slug, title, category, summary, tech_tags, github_url, published_at FROM portfolio_items WHERE status = 'published' ORDER BY published_at DESC`;
    return sendJson(res, 200, { items: rows });
  } catch (err) {
    console.error("portfolio list failed", err);
    return sendJson(res, 500, { error: "Something went wrong loading portfolio items." });
  }
}
