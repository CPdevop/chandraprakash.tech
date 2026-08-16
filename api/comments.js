const { sql } = require("../lib/db");
const { getClientIp, isValidEmail, cleanText, isHoneypotTripped, sendJson } = require("../lib/utils");

const COOLDOWN_SECONDS = 60;

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

async function handleGet(req, res) {
  const slug = cleanText(req.query.slug, 200);
  if (!slug) return sendJson(res, 400, { error: "Missing slug" });

  try {
    const rows = await sql`
      SELECT id, name, body, created_at, admin_reply, admin_reply_at, admin_reaction
      FROM comments
      WHERE post_slug = ${slug} AND status = 'approved'
      ORDER BY created_at ASC
    `;
    return sendJson(res, 200, { comments: rows });
  } catch (err) {
    console.error("comments GET failed", err);
    return sendJson(res, 500, { error: "Something went wrong loading comments." });
  }
}

async function handlePost(req, res) {
  const body = req.body || {};

  if (isHoneypotTripped(body)) {
    // Pretend success so the bot doesn't learn anything, just don't store it.
    return sendJson(res, 201, { ok: true });
  }

  const slug = cleanText(body.slug, 200);
  const name = cleanText(body.name, 100);
  const email = cleanText(body.email, 254);
  const comment = cleanText(body.body, 2000);

  if (!slug || !name || !comment) {
    return sendJson(res, 400, { error: "Name and comment are required." });
  }
  if (!isValidEmail(email)) {
    return sendJson(res, 400, { error: "Please enter a valid email address." });
  }

  const ip = getClientIp(req);

  try {
    const recent = await sql`
      SELECT id FROM comments
      WHERE ip_address = ${ip} AND created_at > now() - (${COOLDOWN_SECONDS} || ' seconds')::interval
      LIMIT 1
    `;
    if (recent.length > 0) {
      return sendJson(res, 429, { error: "Please wait a moment before submitting another comment." });
    }

    await sql`
      INSERT INTO comments (post_slug, name, email, body, ip_address)
      VALUES (${slug}, ${name}, ${email}, ${comment}, ${ip})
    `;
    return sendJson(res, 201, { ok: true, message: "Thanks — your comment has been submitted and will appear once it's reviewed." });
  } catch (err) {
    console.error("comments POST failed", err);
    return sendJson(res, 500, { error: "Something went wrong submitting your comment." });
  }
}
