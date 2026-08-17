// Consolidated admin moderation endpoint: pending queue, approve/reject,
// answering questions, browsing approved comments, replies and reactions.
// Original URLs (/api/admin/pending, /api/admin/moderate, etc.) are
// preserved via vercel.json rewrites.

const { sql } = require("../../lib/db");
const { isAdminRequest, cleanText, sendJson } = require("../../lib/utils");

const REACT_EMOJI = ["👍", "❤️", "💡", "🔥", "👏"];

module.exports = async function handler(req, res) {
  if (!isAdminRequest(req)) return sendJson(res, 401, { error: "Unauthorized" });

  switch (req.query.resource) {
    case "pending": return pendingHandler(req, res);
    case "moderate": return moderateHandler(req, res);
    case "answer": return answerHandler(req, res);
    case "approved-comments": return approvedCommentsHandler(req, res);
    case "reply": return replyHandler(req, res);
    case "react": return reactHandler(req, res);
    default: return sendJson(res, 404, { error: "Unknown resource" });
  }
};

async function pendingHandler(req, res) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return sendJson(res, 405, { error: "Method not allowed" }); }
  try {
    var results = await Promise.all([
      sql`SELECT id, post_slug, name, email, body, created_at FROM comments WHERE status = 'pending' ORDER BY created_at ASC`,
      sql`SELECT id, post_slug, name, email, question, created_at FROM questions WHERE status = 'pending' ORDER BY created_at ASC`,
      sql`SELECT id, name, email, message, inquiry_type, created_at FROM inquiries ORDER BY created_at DESC LIMIT 20`,
    ]);
    return sendJson(res, 200, { comments: results[0], questions: results[1], inquiries: results[2] });
  } catch (err) {
    console.error("moderation/pending failed", err);
    return sendJson(res, 500, { error: "Something went wrong loading the queue." });
  }
}

async function moderateHandler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return sendJson(res, 405, { error: "Method not allowed" }); }
  var body = req.body || {};
  var type = body.type, id = body.id, action = body.action;
  if (!["comment", "question"].includes(type) || !["approve", "reject"].includes(action) || !id) {
    return sendJson(res, 400, { error: "Expected { type: 'comment'|'question', id, action: 'approve'|'reject' }" });
  }
  var status = action === "approve" ? "approved" : "rejected";
  try {
    if (type === "comment") await sql`UPDATE comments SET status = ${status} WHERE id = ${id}`;
    else await sql`UPDATE questions SET status = ${status} WHERE id = ${id}`;
    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error("moderation/moderate failed", err);
    return sendJson(res, 500, { error: "Something went wrong updating that item." });
  }
}

async function answerHandler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return sendJson(res, 405, { error: "Method not allowed" }); }
  var body = req.body || {};
  var id = body.id;
  var answer = cleanText(body.answer, 4000);
  if (!id || !answer) return sendJson(res, 400, { error: "Expected { id, answer }" });
  try {
    await sql`UPDATE questions SET answer = ${answer}, status = 'answered', answered_at = now() WHERE id = ${id}`;
    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error("moderation/answer failed", err);
    return sendJson(res, 500, { error: "Something went wrong saving that answer." });
  }
}

async function approvedCommentsHandler(req, res) {
  if (req.method !== "GET") { res.setHeader("Allow", "GET"); return sendJson(res, 405, { error: "Method not allowed" }); }
  var slug = cleanText(req.query.slug, 200);
  try {
    var rows = slug
      ? await sql`SELECT id, post_slug, name, email, body, admin_reply, admin_reaction, created_at FROM comments WHERE status = 'approved' AND post_slug = ${slug} ORDER BY created_at DESC LIMIT 100`
      : await sql`SELECT id, post_slug, name, email, body, admin_reply, admin_reaction, created_at FROM comments WHERE status = 'approved' ORDER BY created_at DESC LIMIT 100`;
    return sendJson(res, 200, { comments: rows });
  } catch (err) {
    console.error("moderation/approved-comments failed", err);
    return sendJson(res, 500, { error: "Something went wrong loading comments." });
  }
}

async function replyHandler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return sendJson(res, 405, { error: "Method not allowed" }); }
  var body = req.body || {};
  var id = body.id;
  var reply = cleanText(body.reply, 2000);
  if (!id) return sendJson(res, 400, { error: "Expected { id, reply }" });
  try {
    await sql`UPDATE comments SET admin_reply = ${reply || null}, admin_reply_at = ${reply ? new Date().toISOString() : null} WHERE id = ${id}`;
    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error("moderation/reply failed", err);
    return sendJson(res, 500, { error: "Something went wrong saving that reply." });
  }
}

async function reactHandler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return sendJson(res, 405, { error: "Method not allowed" }); }
  var body = req.body || {};
  var id = body.id, emoji = body.emoji;
  if (!id) return sendJson(res, 400, { error: "Expected { id, emoji }" });
  if (emoji && !REACT_EMOJI.includes(emoji)) return sendJson(res, 400, { error: "Unsupported emoji." });
  try {
    await sql`UPDATE comments SET admin_reaction = ${emoji || null} WHERE id = ${id}`;
    return sendJson(res, 200, { ok: true });
  } catch (err) {
    console.error("moderation/react failed", err);
    return sendJson(res, 500, { error: "Something went wrong saving that reaction." });
  }
}
