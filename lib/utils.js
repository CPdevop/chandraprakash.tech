// Small shared helpers for the API handlers: nothing framework-specific,
// works with plain Vercel Node function (req, res) signatures.

function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : "unknown";
}

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function cleanText(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

// Honeypot: a hidden form field real visitors never fill in. Bots that
// auto-fill every field will populate it, so a non-empty value means "bot".
function isHoneypotTripped(body) {
  return typeof body.website === "string" && body.website.trim().length > 0;
}

function isAdminRequest(req) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) return false;
  const header = req.headers.authorization || "";
  return header === `Bearer ${expected}`;
}

function sendJson(res, status, payload) {
  res.status(status).setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

module.exports = { getClientIp, isValidEmail, cleanText, isHoneypotTripped, isAdminRequest, sendJson };
