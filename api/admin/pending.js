const { sql } = require("../../lib/db");
const { isAdminRequest, sendJson } = require("../../lib/utils");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Method not allowed" });
  }
  if (!isAdminRequest(req)) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  try {
    const [pendingComments, pendingQuestions, recentInquiries] = await Promise.all([
      sql`SELECT id, post_slug, name, email, body, created_at FROM comments WHERE status = 'pending' ORDER BY created_at ASC`,
      sql`SELECT id, post_slug, name, email, question, created_at FROM questions WHERE status = 'pending' ORDER BY created_at ASC`,
      sql`SELECT id, name, email, message, inquiry_type, created_at FROM inquiries ORDER BY created_at DESC LIMIT 20`,
    ]);
    return sendJson(res, 200, { comments: pendingComments, questions: pendingQuestions, inquiries: recentInquiries });
  } catch (err) {
    console.error("admin/pending failed", err);
    return sendJson(res, 500, { error: "Something went wrong loading the queue." });
  }
};
