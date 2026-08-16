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

  try {
    const rows = slug
      ? await sql`
          SELECT id, name, question, answer, created_at, answered_at
          FROM questions
          WHERE status = 'answered' AND post_slug = ${slug}
          ORDER BY answered_at DESC
        `
      : await sql`
          SELECT id, name, question, answer, created_at, answered_at
          FROM questions
          WHERE status = 'answered'
          ORDER BY answered_at DESC
        `;
    return sendJson(res, 200, { questions: rows });
  } catch (err) {
    console.error("questions GET failed", err);
    return sendJson(res, 500, { error: "Something went wrong loading questions." });
  }
}

async function handlePost(req, res) {
  const body = req.body || {};

  if (isHoneypotTripped(body)) {
    return sendJson(res, 201, { ok: true });
  }

  const slug = cleanText(body.slug, 200) || null;
  const name = cleanText(body.name, 100);
  const email = cleanText(body.email, 254);
  const question = cleanText(body.question, 1000);

  if (!name || !question) {
    return sendJson(res, 400, { error: "Name and question are required." });
  }
  if (!isValidEmail(email)) {
    return sendJson(res, 400, { error: "Please enter a valid email address." });
  }

  const ip = getClientIp(req);

  try {
    const recent = await sql`
      SELECT id FROM questions
      WHERE ip_address = ${ip} AND created_at > now() - (${COOLDOWN_SECONDS} || ' seconds')::interval
      LIMIT 1
    `;
    if (recent.length > 0) {
      return sendJson(res, 429, { error: "Please wait a moment before submitting another question." });
    }

    await sql`
      INSERT INTO questions (post_slug, name, email, question, ip_address)
      VALUES (${slug}, ${name}, ${email}, ${question}, ${ip})
    `;
    return sendJson(res, 201, { ok: true, message: "Thanks — your question has been submitted. It'll appear here once it's answered." });
  } catch (err) {
    console.error("questions POST failed", err);
    return sendJson(res, 500, { error: "Something went wrong submitting your question." });
  }
}
