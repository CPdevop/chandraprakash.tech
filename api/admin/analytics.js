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
    const [
      commentsByStatus,
      questionsByStatus,
      inquiriesByType,
      topPostsByComments,
      reactionsByEmoji,
      topPostsByReactions,
      dailyActivity,
    ] = await Promise.all([
      sql`SELECT status, COUNT(*)::int AS count FROM comments GROUP BY status`,
      sql`SELECT status, COUNT(*)::int AS count FROM questions GROUP BY status`,
      sql`SELECT inquiry_type, COUNT(*)::int AS count FROM inquiries GROUP BY inquiry_type`,
      sql`
        SELECT post_slug, COUNT(*)::int AS count FROM comments
        WHERE status = 'approved'
        GROUP BY post_slug ORDER BY count DESC LIMIT 5
      `,
      sql`SELECT emoji, COUNT(*)::int AS count FROM post_reactions GROUP BY emoji ORDER BY count DESC`,
      sql`
        SELECT post_slug, COUNT(*)::int AS count FROM post_reactions
        GROUP BY post_slug ORDER BY count DESC LIMIT 5
      `,
      sql`
        SELECT day::date AS day, COALESCE(SUM(count), 0)::int AS count FROM (
          SELECT date_trunc('day', created_at) AS day, COUNT(*) AS count FROM comments
            WHERE created_at > now() - interval '14 days' GROUP BY 1
          UNION ALL
          SELECT date_trunc('day', created_at) AS day, COUNT(*) AS count FROM questions
            WHERE created_at > now() - interval '14 days' GROUP BY 1
          UNION ALL
          SELECT date_trunc('day', created_at) AS day, COUNT(*) AS count FROM inquiries
            WHERE created_at > now() - interval '14 days' GROUP BY 1
          UNION ALL
          SELECT date_trunc('day', created_at) AS day, COUNT(*) AS count FROM post_reactions
            WHERE created_at > now() - interval '14 days' GROUP BY 1
        ) combined
        GROUP BY day ORDER BY day ASC
      `,
    ]);

    return sendJson(res, 200, {
      commentsByStatus,
      questionsByStatus,
      inquiriesByType,
      topPostsByComments,
      reactionsByEmoji,
      topPostsByReactions,
      dailyActivity,
    });
  } catch (err) {
    console.error("admin/analytics failed", err);
    return sendJson(res, 500, { error: "Something went wrong loading analytics." });
  }
};
