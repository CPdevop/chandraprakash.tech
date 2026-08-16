const { sql } = require("../../lib/db");
const { isAdminRequest, cleanText, sendJson } = require("../../lib/utils");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  }
  if (!isAdminRequest(req)) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  const { id } = req.body || {};
  const answer = cleanText((req.body || {}).answer, 4000);
  if (!id || !answer) {
    return sendJson(res, 400, { error: "Expected { id, answer }" });
  }

  try {
    await sql`
      UPDATE questions
      SET answer = ${answer}, status = 'answered', answered_at = now()
      WHERE id = ${id}
    `;
    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error("admin/answer failed", err);
    return sendJson(res, 500, { error: "Something went wrong saving that answer." });
  }
};
