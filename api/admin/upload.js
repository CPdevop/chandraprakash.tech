const { put } = require("@vercel/blob");
const { isAdminRequest, sendJson } = require("../../lib/utils");

// Vercel Functions cap request bodies at 4.5MB, and base64 inflates size by
// ~33%, so keep the real limit comfortably under that.
const MAX_BYTES = 4 * 1024 * 1024;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { error: "Method not allowed" });
  }
  if (!isAdminRequest(req)) {
    return sendJson(res, 401, { error: "Unauthorized" });
  }
  // Newer Vercel Blob stores connect via BLOB_STORE_ID + an automatic runtime
  // credential (OIDC) rather than a manually-copied BLOB_READ_WRITE_TOKEN, so
  // accept either as evidence the store is actually connected to this project.
  if (!process.env.BLOB_READ_WRITE_TOKEN && !process.env.BLOB_STORE_ID) {
    return sendJson(res, 500, { error: "Image storage isn't connected yet. Create/connect a Blob store in the Vercel dashboard." });
  }

  var body = req.body || {};
  var filename = String(body.filename || "upload").replace(/[^a-zA-Z0-9._-]/g, "-");
  var dataUrl = body.dataUrl || "";
  var match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    return sendJson(res, 400, { error: "Expected a base64 data URL." });
  }

  var contentType = match[1];
  var buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_BYTES) {
    return sendJson(res, 413, { error: "Image is too large. Keep uploads under 4MB." });
  }
  if (!/^image\//.test(contentType)) {
    return sendJson(res, 400, { error: "Only image uploads are supported." });
  }

  try {
    var blob = await put("uploads/" + Date.now() + "-" + filename, buffer, {
      access: "public",
      contentType: contentType,
    });
    return sendJson(res, 201, { ok: true, url: blob.url });
  } catch (err) {
    console.error("upload failed", err);
    return sendJson(res, 500, { error: "Something went wrong uploading that image." });
  }
};
