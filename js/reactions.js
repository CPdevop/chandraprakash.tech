(function () {
  "use strict";

  var widget = document.getElementById("reactions");
  if (!widget) return;

  var slug = widget.getAttribute("data-slug");
  var buttons = Array.prototype.slice.call(widget.querySelectorAll(".reaction-btn"));

  function applyState(counts, mine) {
    buttons.forEach(function (btn) {
      var emoji = btn.getAttribute("data-emoji");
      btn.querySelector(".reaction-count").textContent = (counts && counts[emoji]) || 0;
      btn.classList.toggle("is-active", mine && mine.indexOf(emoji) !== -1);
    });
  }

  fetch("/api/reactions?slug=" + encodeURIComponent(slug))
    .then(function (r) { return r.json(); })
    .then(function (data) { applyState(data.counts, data.mine); })
    .catch(function () {});

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var emoji = btn.getAttribute("data-emoji");
      btn.disabled = true;
      fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: slug, emoji: emoji })
      })
        .then(function (r) { return r.json(); })
        .then(function (data) {
          btn.disabled = false;
          applyState(data.counts, data.mine);
        })
        .catch(function () { btn.disabled = false; });
    });
  });
})();
