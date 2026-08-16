const { sql } = require("../lib/db");
const { getClientIp, isValidEmail, cleanText, isHoneypotTripped, sendJson } = require("../lib/utils");

const COOLDOWN_SECONDS = 60;
const VALID_TYPES = ["freelance", "job", "general"];

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  }

  const body = req.body || {};

  if (isHoneypotTripped(body)) {
    return sendJson(res, 201, { ok: true });
  }

  const name = cleanText(body.name, 100);
  const email = cleanText(body.email, 254);
  const message = cleanText(body.message, 3000);
  const inquiryType = VALID_TYPES.includes(body.inquiryType) ? body.inquiryType : "general";

  if (!name || !message) {
    return sendJson(res, 400, { error: "Name and message are required." });
  }
  if (!isValidEmail(email)) {
    return sendJson(res, 400, { error: "Please enter a valid email address." });
  }

  const ip = getClientIp(req);

  try {
    const recent = await sql`
      SELECT id FROM inquiries
      WHERE ip_address = ${ip} AND created_at > now() - (${COOLDOWN_SECONDS} || ' seconds')::interval
      LIMIT 1
    `;
    if (recent.length > 0) {
      return sendJson(res, 429, { error: "Please wait a moment before submitting again." });
    }

    await sql`
      INSERT INTO inquiries (name, email, message, inquiry_type, ip_address)
      VALUES (${name}, ${email}, ${message}, ${inquiryType}, ${ip})
    `;
    return sendJson(res, 201, { ok: true, message: "Thanks — I'll get back to you soon." });
  } catch (err) {
    console.error("inquiries POST failed", err);
    return sendJson(res, 500, { error: "Something went wrong submitting your message." });
  }
}
