// Shared across every /admin/*.html page: the token gate, the sidebar shell,
// and an authFetch helper. Each page calls AdminShell.init(activePage, onReady).

window.AdminShell = (function () {
  "use strict";

  var NAV_ITEMS = [
    { key: "dashboard", href: "/admin/", label: "Dashboard", icon: '<path d="M4 13h6V4H4v9zM14 20h6v-9h-6v9zM14 4v5h6V4h-6zM4 20h6v-5H4v5z"/>' },
    { key: "articles", href: "/admin/articles.html", label: "Articles", icon: '<path d="M5 4h11l3 3v13H5V4z"/><path d="M9 10h7M9 14h7M9 18h4"/>' },
    { key: "portfolio", href: "/admin/portfolio.html", label: "Portfolio", icon: '<path d="M4 8h16v11H4z"/><path d="M9 8V6a3 3 0 013-3h0a3 3 0 013 3v2"/>' },
  ];

  function getToken() {
    return sessionStorage.getItem("adminToken") || "";
  }

  function authFetch(url, options) {
    options = options || {};
    options.headers = Object.assign({}, options.headers, { Authorization: "Bearer " + getToken() });
    return fetch(url, options);
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function buildShell(activePage) {
    var navHtml = NAV_ITEMS.map(function (item) {
      return (
        '<a href="' + item.href + '" class="' + (item.key === activePage ? "is-active" : "") + '">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true">' + item.icon + "</svg>" +
        item.label +
        "</a>"
      );
    }).join("");

    return (
      '<div class="admin-sidebar">' +
      '<div class="admin-brand">Chandraprakash<span>.</span> Admin</div>' +
      '<nav class="admin-nav">' + navHtml + "</nav>" +
      '<div class="admin-sidebar-footer">' +
      '<a href="/" target="_blank" rel="noopener">View site &rarr;</a>' +
      '<button id="adminLogoutBtn" type="button">Log out</button>' +
      "</div></div>"
    );
  }

  function init(activePage, onReady) {
    var gate = document.getElementById("gate");
    var shellRoot = document.getElementById("shellRoot");

    function showGate(errorMsg) {
      sessionStorage.removeItem("adminToken");
      if (shellRoot) shellRoot.hidden = true;
      gate.hidden = false;
      var err = document.getElementById("gateError");
      if (err) {
        err.hidden = !errorMsg;
        err.textContent = errorMsg || "";
      }
    }

    function showShell() {
      gate.hidden = true;
      if (shellRoot) {
        shellRoot.hidden = false;
        var sidebarMount = document.getElementById("sidebarMount");
        if (sidebarMount) sidebarMount.innerHTML = buildShell(activePage);
        var logoutBtn = document.getElementById("adminLogoutBtn");
        if (logoutBtn) logoutBtn.addEventListener("click", function () { showGate(); });
      }
      onReady();
    }

    var tokenInput = document.getElementById("tokenInput");
    var unlockBtn = document.getElementById("unlockBtn");
    if (unlockBtn) {
      unlockBtn.addEventListener("click", function () {
        var token = tokenInput.value.trim();
        if (!token) return;
        sessionStorage.setItem("adminToken", token);
        showShell();
      });
      tokenInput.addEventListener("keydown", function (e) { if (e.key === "Enter") unlockBtn.click(); });
    }

    if (getToken()) showShell();

    return { showGate: showGate };
  }

  return { init: init, authFetch: authFetch, getToken: getToken, escapeHtml: escapeHtml };
})();
