const { sql } = require("../../lib/db");
const { isAdminRequest, sendJson } = require("../../lib/utils");

const ALLOWED_EMOJI = ["👍", "❤️", "💡", "🔥", "👏"];

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  }
  if (!isAdminRequest(req)) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  const { id, emoji } = req.body || {};
  if (!id) return sendJson(res, 400, { error: "Expected { id, emoji }" });
  if (emoji && !ALLOWED_EMOJI.includes(emoji)) {
    return sendJson(res, 400, { error: "Unsupported emoji." });
  }

  try {
    // Passing an empty/missing emoji clears the reaction (click again to toggle off).
    await sql`UPDATE comments SET admin_reaction = ${emoji || null} WHERE id = ${id}`;
    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error("admin/react failed", err);
    return sendJson(res, 500, { error: "Something went wrong saving that reaction." });
  }
};
