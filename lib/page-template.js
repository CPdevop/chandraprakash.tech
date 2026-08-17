// Renders a full article/portfolio HTML page server-side, matching the
// existing static article template exactly (same header, footer, nav,
// comments, reactions) so CMS-authored content looks identical to the
// hand-written articles.

const THEME_SCRIPT = `(function(){try{if(localStorage.getItem('theme')==='light'){document.documentElement.setAttribute('data-theme','light');}}catch(e){}})();`;

const HEADER = `
<a class="skip-link" href="#main">Skip to content</a>

<header class="site-header" id="site-header">
  <nav class="nav container" aria-label="Primary">
    <a href="/" class="nav-logo">Chandraprakash<span class="accent-text">.</span></a>
    <div class="nav-right">
      <ul class="nav-menu" id="navMenu">
        <li><a href="/#home" class="nav-link">Home</a></li>
        <li><a href="/#what-i-do" class="nav-link">Expertise</a></li>
        <li><a href="/#experience" class="nav-link">Experience</a></li>
        <li><a href="/#approach" class="nav-link">Approach</a></li>
        <li><a href="/blog/" class="nav-link">Writing</a></li>
        <li><a href="/#contact" class="nav-link nav-cta">Contact</a></li>
      </ul>
      <button id="themeToggle" class="theme-toggle" type="button" aria-label="Switch to light mode" aria-pressed="false">
        <svg class="theme-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path class="candle-flame" d="M12 3.6c-1.4 2-1.9 3.4-1 4.5.4.5 1.6.5 2 0 .9-1.1.4-2.5-1-4.5z"></path>
          <rect class="candle-body" x="9" y="10" width="6" height="10.5" rx="1.3"></rect>
          <path class="candle-wick" d="M12 10V7.4"></path>
          <g class="match">
            <line x1="5" y1="20.5" x2="9.5" y2="15.5"></line>
            <circle class="match-head" cx="5" cy="20.5" r="1.2"></circle>
          </g>
        </svg>
      </button>
      <button class="nav-toggle" id="navToggle" aria-expanded="false" aria-controls="navMenu" aria-label="Toggle navigation menu">
        <span></span><span></span><span></span>
      </button>
    </div>
  </nav>
</header>`;

const FOOTER = `
<footer class="site-footer">
  <div class="container footer-inner">
    <div class="footer-brand">
      <strong>Chandraprakash Jha</strong>
      <span>Data Engineering &bull; Data Quality &bull; Data Governance</span>
    </div>
    <a href="https://www.linkedin.com/in/chandraprakash-jha" target="_blank" rel="noopener noreferrer" class="footer-linkedin">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M7.5 10v6M7.5 7.5v.01M12 16v-3.5c0-1.4 1-2.5 2.3-2.5S17 11.1 17 12.5V16"/></svg>
      LinkedIn
    </a>
    <p class="footer-copy">&copy; 2026 Chandraprakash Jha</p>
  </div>
</footer>`;

const FAVICON = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%230a0d13'/%3E%3Ccircle cx='9' cy='11' r='2.4' fill='%234f7cff'/%3E%3Ccircle cx='23' cy='9' r='2.4' fill='%232dd4bf'/%3E%3Ccircle cx='16' cy='22' r='2.4' fill='%234f7cff'/%3E%3Cpath d='M9 11L23 9M9 11L16 22M23 9L16 22' stroke='%233a4356' stroke-width='1.3'/%3E%3C/svg%3E">`;

function esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderArticlePage(article) {
  var url = "https://www.chandraprakash.tech/blog/" + article.slug + "/";
  var title = esc(article.title) + " | Chandraprakash Jha";
  var desc = esc(article.dek || "");
  var ogImage = article.cover_image_url || "https://www.chandraprakash.tech/assets/og-image.jpg";
  var published = article.published_at ? new Date(article.published_at).toISOString().slice(0, 10) : "";
  var updated = article.updated_at ? new Date(article.updated_at).toISOString().slice(0, 10) : published;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<script>${THEME_SCRIPT}</script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="author" content="Chandraprakash Jha">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${url}">

<meta property="og:type" content="article">
<meta property="og:title" content="${esc(article.title)}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:site_name" content="Chandraprakash Jha">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(article.title)}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${esc(ogImage)}">

${FAVICON}

<link rel="stylesheet" href="/css/styles.css">
<link rel="stylesheet" href="/css/blog.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/styles/atom-one-dark.min.css">

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  "headline": ${JSON.stringify(article.title)},
  "description": ${JSON.stringify(article.dek || "")},
  "author": { "@type": "Person", "name": "Chandraprakash Jha", "url": "https://www.chandraprakash.tech/" },
  "datePublished": ${JSON.stringify(published)},
  "dateModified": ${JSON.stringify(updated)},
  "url": ${JSON.stringify(url)},
  "mainEntityOfPage": ${JSON.stringify(url)}
}
</script>
</head>
<body>
${HEADER}

<main id="main">
  <div class="container blog-crumb"><a href="/blog/">&larr; Writing</a></div>

  <div class="container article-header">
    ${article.category ? '<p class="post-card-meta">' + esc(article.category) + "</p>" : ""}
    <h1>${esc(article.title)}</h1>
    ${article.dek ? '<p class="article-dek">' + esc(article.dek) + "</p>" : ""}
  </div>

  <div class="container">
    <article class="article-body">
      ${article.bodyHtml}
    </article>

    <div class="article-byline">
      <img src="/assets/profile.jpg" alt="Chandraprakash Jha">
      <div>
        <p class="article-byline-name">Chandraprakash Jha</p>
        <p class="article-byline-role">Data Engineering &amp; Data Quality</p>
      </div>
    </div>

    ${article.nextArticle ? `
    <nav class="article-nav" aria-label="More articles">
      <a href="/blog/${esc(article.nextArticle.slug)}/">
        <span class="article-nav-label">Next</span>
        ${esc(article.nextArticle.title)}
      </a>
      <a href="/blog/">
        <span class="article-nav-label">All Writing</span>
        Back to index
      </a>
    </nav>` : ""}

    <div class="reactions-bar" id="reactions" data-slug="${esc(article.slug)}">
      <span class="reactions-label">Found this useful?</span>
      <button class="reaction-btn" type="button" data-emoji="👍"><span>👍</span><span class="reaction-count">0</span></button>
      <button class="reaction-btn" type="button" data-emoji="❤️"><span>❤️</span><span class="reaction-count">0</span></button>
      <button class="reaction-btn" type="button" data-emoji="💡"><span>💡</span><span class="reaction-count">0</span></button>
      <button class="reaction-btn" type="button" data-emoji="🔥"><span>🔥</span><span class="reaction-count">0</span></button>
      <button class="reaction-btn" type="button" data-emoji="👏"><span>👏</span><span class="reaction-count">0</span></button>
    </div>

    <section class="comments-section" id="comments" data-slug="${esc(article.slug)}">
      <h2>Comments <span class="comments-count" id="commentsCount"></span></h2>
      <div class="comments-list" id="commentsList"><p class="comments-empty">Loading comments...</p></div>
      <form class="comment-form" id="commentForm">
        <div class="cf-row">
          <input type="text" name="name" placeholder="Name" required maxlength="100">
          <input type="email" name="email" placeholder="Email (not published)" required maxlength="254">
        </div>
        <textarea name="body" placeholder="Add a comment..." required maxlength="2000"></textarea>
        <input type="text" name="website" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true">
        <button type="submit" class="btn btn-primary">Post Comment</button>
        <p class="comment-status" id="commentStatus" hidden></p>
      </form>
    </section>
  </div>
</main>

${FOOTER}

<script src="/js/main.js"></script>
<script src="/js/reactions.js"></script>
<script src="/js/comments.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>
  if (window.hljs) { hljs.highlightAll(); }
  if (window.mermaid) {
    mermaid.initialize({ startOnLoad: true, theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'default' : 'dark' });
  }
</script>
<script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
`;
}

function renderPortfolioPage(item) {
  var url = "https://www.chandraprakash.tech/work/" + item.slug + "/";
  var title = esc(item.title) + " | Chandraprakash Jha";
  var desc = esc(item.summary || "");
  var ogImage = item.cover_image_url || "https://www.chandraprakash.tech/assets/og-image.jpg";
  var tags = (item.tech_tags || "").split(",").map(function (t) { return t.trim(); }).filter(Boolean);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<script>${THEME_SCRIPT}</script>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta name="author" content="Chandraprakash Jha">
<meta name="robots" content="index, follow">
<link rel="canonical" href="${url}">

<meta property="og:type" content="website">
<meta property="og:title" content="${esc(item.title)}">
<meta property="og:description" content="${desc}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${esc(ogImage)}">
<meta property="og:site_name" content="Chandraprakash Jha">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(item.title)}">
<meta name="twitter:image" content="${esc(ogImage)}">

${FAVICON}

<link rel="stylesheet" href="/css/styles.css">
<link rel="stylesheet" href="/css/blog.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/styles/atom-one-dark.min.css">
</head>
<body>
${HEADER}

<main id="main">
  <div class="container blog-crumb"><a href="/#work">&larr; Selected Work</a></div>

  <div class="container article-header">
    ${item.category ? '<p class="post-card-meta">' + esc(item.category) + "</p>" : ""}
    <h1>${esc(item.title)}</h1>
    ${item.summary ? '<p class="article-dek">' + esc(item.summary) + "</p>" : ""}
  </div>

  <div class="container">
    ${tags.length ? '<div class="project-tags" style="max-width:700px;margin-bottom:24px;">' + tags.map(function (t) { return "<span>" + esc(t) + "</span>"; }).join("") + "</div>" : ""}
    ${item.github_url ? '<p style="max-width:700px;margin-bottom:24px;"><a class="project-link" href="' + esc(item.github_url) + '" target="_blank" rel="noopener noreferrer">View on GitHub &rarr;</a></p>' : ""}

    <article class="article-body">
      ${item.bodyHtml}
    </article>

    <div class="article-byline">
      <img src="/assets/profile.jpg" alt="Chandraprakash Jha">
      <div>
        <p class="article-byline-name">Chandraprakash Jha</p>
        <p class="article-byline-role">Data Engineering &amp; Data Quality</p>
      </div>
    </div>

    <div class="reactions-bar" id="reactions" data-slug="work-${esc(item.slug)}">
      <span class="reactions-label">Found this useful?</span>
      <button class="reaction-btn" type="button" data-emoji="👍"><span>👍</span><span class="reaction-count">0</span></button>
      <button class="reaction-btn" type="button" data-emoji="❤️"><span>❤️</span><span class="reaction-count">0</span></button>
      <button class="reaction-btn" type="button" data-emoji="💡"><span>💡</span><span class="reaction-count">0</span></button>
      <button class="reaction-btn" type="button" data-emoji="🔥"><span>🔥</span><span class="reaction-count">0</span></button>
      <button class="reaction-btn" type="button" data-emoji="👏"><span>👏</span><span class="reaction-count">0</span></button>
    </div>

    <section class="comments-section" id="comments" data-slug="work-${esc(item.slug)}">
      <h2>Comments <span class="comments-count" id="commentsCount"></span></h2>
      <div class="comments-list" id="commentsList"><p class="comments-empty">Loading comments...</p></div>
      <form class="comment-form" id="commentForm">
        <div class="cf-row">
          <input type="text" name="name" placeholder="Name" required maxlength="100">
          <input type="email" name="email" placeholder="Email (not published)" required maxlength="254">
        </div>
        <textarea name="body" placeholder="Add a comment..." required maxlength="2000"></textarea>
        <input type="text" name="website" class="hp-field" tabindex="-1" autocomplete="off" aria-hidden="true">
        <button type="submit" class="btn btn-primary">Post Comment</button>
        <p class="comment-status" id="commentStatus" hidden></p>
      </form>
    </section>
  </div>
</main>

${FOOTER}

<script src="/js/main.js"></script>
<script src="/js/reactions.js"></script>
<script src="/js/comments.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.10.0/highlight.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>
  if (window.hljs) { hljs.highlightAll(); }
  if (window.mermaid) {
    mermaid.initialize({ startOnLoad: true, theme: document.documentElement.getAttribute('data-theme') === 'light' ? 'default' : 'dark' });
  }
</script>
<script defer src="/_vercel/insights/script.js"></script>
</body>
</html>
`;
}

function renderNotFoundPage(kind) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>Not Found | Chandraprakash Jha</title>
<meta name="robots" content="noindex">
<link rel="stylesheet" href="/css/styles.css"></head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;">
<div><h1 style="font-size:1.6rem;">That ${esc(kind || "page")} doesn't exist (or isn't published yet).</h1>
<p style="margin-top:12px;"><a href="/blog/" style="color:var(--accent-soft);">&larr; Back to Writing</a></p></div>
</body></html>`;
}

module.exports = {
  renderArticlePage: renderArticlePage,
  renderPortfolioPage: renderPortfolioPage,
  renderNotFoundPage: renderNotFoundPage,
  esc: esc,
};
