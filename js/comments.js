(function () {
  "use strict";

  var section = document.getElementById("comments");
  if (!section) return;

  var slug = section.getAttribute("data-slug");
  var listEl = document.getElementById("commentsList");
  var form = document.getElementById("commentForm");
  var statusEl = document.getElementById("commentStatus");
  var countEl = document.getElementById("commentsCount");

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch (e) {
      return "";
    }
  }

  function renderComments(comments) {
    if (countEl) countEl.textContent = comments.length ? "(" + comments.length + ")" : "";
    if (!comments.length) {
      listEl.innerHTML = '<p class="comments-empty">No comments yet. Be the first to add one.</p>';
      return;
    }
    listEl.innerHTML = comments
      .map(function (c) {
        var reaction = c.admin_reaction ? '<p class="comment-reaction">' + escapeHtml(c.admin_reaction) + "</p>" : "";
        var reply = c.admin_reply
          ? '<div class="comment-reply"><p class="comment-reply-label">Chandraprakash replied</p><p class="comment-reply-body">' + escapeHtml(c.admin_reply) + "</p></div>"
          : "";
        return (
          '<article class="comment-item">' +
          '<p class="comment-meta"><span class="comment-name">' + escapeHtml(c.name) + "</span> &middot; " + formatDate(c.created_at) + "</p>" +
          '<p class="comment-body">' + escapeHtml(c.body) + "</p>" +
          reaction +
          reply +
          "</article>"
        );
      })
      .join("");
  }

  function loadComments() {
    fetch("/api/comments?slug=" + encodeURIComponent(slug))
      .then(function (r) { return r.json(); })
      .then(function (data) { renderComments(data.comments || []); })
      .catch(function () {
        listEl.innerHTML = '<p class="comments-empty">Couldn\'t load comments right now.</p>';
      });
  }

  function setStatus(message, isError) {
    statusEl.textContent = message;
    statusEl.hidden = false;
    statusEl.classList.toggle("is-error", !!isError);
  }

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var formData = new FormData(form);
      var payload = {
        slug: slug,
        name: formData.get("name"),
        email: formData.get("email"),
        body: formData.get("body"),
        website: formData.get("website") // honeypot
      };

      var submitBtn = form.querySelector('button[type="submit"]');
      submitBtn.disabled = true;

      fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
        .then(function (result) {
          submitBtn.disabled = false;
          if (result.ok) {
            setStatus(result.data.message || "Thanks — your comment is pending review.", false);
            form.reset();
          } else {
            setStatus(result.data.error || "Something went wrong.", true);
          }
        })
        .catch(function () {
          submitBtn.disabled = false;
          setStatus("Something went wrong. Please try again.", true);
        });
    });
  }

  loadComments();
})();
