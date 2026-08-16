const { sql } = require("../../lib/db");
const { isAdminRequest, sendJson } = require("../../lib/utils");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  }
  if (!isAdminRequest(req)) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  const { type, id, action } = req.body || {};
  if (!["comment", "question"].includes(type) || !["approve", "reject"].includes(action) || !id) {
    return sendJson(res, 400, { error: "Expected { type: 'comment'|'question', id, action: 'approve'|'reject' }" });
  }

  const status = action === "approve" ? "approved" : "rejected";

  try {
    if (type === "comment") {
      await sql`UPDATE comments SET status = ${status} WHERE id = ${id}`;
    } else {
      await sql`UPDATE questions SET status = ${status} WHERE id = ${id}`;
    }
    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error("admin/moderate failed", err);
    return sendJson(res, 500, { error: "Something went wrong updating that item." });
  }
};
