const { sql } = require("../lib/db");
const { getClientIp, cleanText, sendJson } = require("../lib/utils");

// Fixed, intentional set — not free-text emoji input.
const ALLOWED_EMOJI = ["👍", "❤️", "💡", "🔥", "👏"];

module.exports = async function handler(req, res) {
  if (req.method === "GET") {
    return handleGet(req, res);
  }
  if (req.method === "POST") {
    return handlePost(req, res);
  }
  res.setHeader("Allow", "GET, POST");
  return sendJson(res, 405, { error: "Method not allowed" });
};

async function getCounts(slug) {
  const rows = await sql`
    SELECT emoji, COUNT(*)::int AS count
    FROM post_reactions
    WHERE post_slug = ${slug}
    GROUP BY emoji
  `;
  const counts = {};
  ALLOWED_EMOJI.forEach((e) => (counts[e] = 0));
  rows.forEach((r) => (counts[r.emoji] = r.count));
  return counts;
}

async function handleGet(req, res) {
  const slug = cleanText(req.query.slug, 200);
  if (!slug) return sendJson(res, 400, { error: "Missing slug" });

  try {
    const counts = await getCounts(slug);
    const ip = getClientIp(req);
    const mine = await sql`SELECT emoji FROM post_reactions WHERE post_slug = ${slug} AND ip_address = ${ip}`;
    return sendJson(res, 200, { counts: counts, mine: mine.map((r) => r.emoji) });
  } catch (err) {
    console.error("reactions GET failed", err);
    return sendJson(res, 500, { error: "Something went wrong loading reactions." });
  }
}

async function handlePost(req, res) {
  const body = req.body || {};
  const slug = cleanText(body.slug, 200);
  const emoji = body.emoji;

  if (!slug || !ALLOWED_EMOJI.includes(emoji)) {
    return sendJson(res, 400, { error: "Invalid slug or emoji." });
  }

  const ip = getClientIp(req);

  try {
    const existing = await sql`
      SELECT id FROM post_reactions WHERE post_slug = ${slug} AND emoji = ${emoji} AND ip_address = ${ip}
    `;
    if (existing.length > 0) {
      await sql`DELETE FROM post_reactions WHERE id = ${existing[0].id}`;
    } else {
      await sql`
        INSERT INTO post_reactions (post_slug, emoji, ip_address)
        VALUES (${slug}, ${emoji}, ${ip})
        ON CONFLICT (post_slug, emoji, ip_address) DO NOTHING
      `;
    }
    const counts = await getCounts(slug);
    const mine = await sql`SELECT emoji FROM post_reactions WHERE post_slug = ${slug} AND ip_address = ${ip}`;
    return sendJson(res, 200, { counts: counts, mine: mine.map((r) => r.emoji) });
  } catch (err) {
    console.error("reactions POST failed", err);
    return sendJson(res, 500, { error: "Something went wrong saving your reaction." });
  }
}
