const { sql } = require("../../lib/db");
const { isAdminRequest, cleanText, sendJson } = require("../../lib/utils");

// Browse approved comments (so the admin can reply/react after the fact,
// not only at the moment of approval).
module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return sendJson(res, 405, { error: "Method not allowed" });
  }
  if (!isAdminRequest(req)) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }

  const slug = cleanText(req.query.slug, 200);

  try {
    const rows = slug
      ? await sql`
          SELECT id, post_slug, name, email, body, admin_reply, admin_reaction, created_at
          FROM comments WHERE status = 'approved' AND post_slug = ${slug}
          ORDER BY created_at DESC LIMIT 100
        `
      : await sql`
          SELECT id, post_slug, name, email, body, admin_reply, admin_reaction, created_at
          FROM comments WHERE status = 'approved'
          ORDER BY created_at DESC LIMIT 100
        `;
    return sendJson(res, 200, { comments: rows });
  } catch (err) {
    console.error("admin/comments failed", err);
    return sendJson(res, 500, { error: "Something went wrong loading comments." });
  }
};
