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
  const reply = cleanText((req.body || {}).reply, 2000);
  if (!id) return sendJson(res, 400, { error: "Expected { id, reply }" });

  try {
    // Empty reply clears it — lets the admin retract a reply.
    await sql`
      UPDATE comments
      SET admin_reply = ${reply || null}, admin_reply_at = ${reply ? new Date().toISOString() : null}
      WHERE id = ${id}
    `;
    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error("admin/reply failed", err);
    return sendJson(res, 500, { error: "Something went wrong saving that reply." });
  }
};
