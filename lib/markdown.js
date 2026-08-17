// Shared Markdown → HTML rendering, used by both the admin preview pane
// (via a tiny client copy, see admin/edit.html) and server-side rendering
// of published articles/portfolio items.
//
// Fenced ```mermaid blocks become <pre class="mermaid"> for Mermaid.js to
// render client-side. Other fenced blocks keep a language-xxx class for
// highlight.js to pick up client-side. Both libraries are loaded via CDN
// on the rendered page — no build step needed.

const { marked } = require("marked");

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const renderer = new marked.Renderer();
const originalCode = renderer.code.bind(renderer);

renderer.code = function (token) {
  var lang = (token.lang || "").trim().toLowerCase();
  if (lang === "mermaid") {
    return '<pre class="mermaid">' + escapeHtml(token.text) + "</pre>\n";
  }
  return originalCode(token);
};

marked.setOptions({ renderer: renderer, breaks: false, gfm: true });

function renderMarkdown(markdown) {
  return marked.parse(markdown || "");
}

module.exports = { renderMarkdown };
