(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Mobile nav toggle ---------- */
  var navToggle = document.getElementById("navToggle");
  var navMenu = document.getElementById("navMenu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      var isOpen = navMenu.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    navMenu.querySelectorAll(".nav-link").forEach(function (link) {
      link.addEventListener("click", function () {
        navMenu.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- Profile photo fallback ---------- */
  var profilePhoto = document.getElementById("profilePhoto");
  if (profilePhoto) {
    profilePhoto.addEventListener("error", function () {
      var frame = profilePhoto.closest(".photo-frame");
      if (frame) frame.classList.add("no-photo");
    });
  }

  /* ---------- Scroll reveal ---------- */
  var animatedEls = document.querySelectorAll("[data-animate]");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    animatedEls.forEach(function (el) { el.classList.add("in-view"); });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    animatedEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Counting stat numbers ---------- */
  var counters = document.querySelectorAll(".count[data-count]");

  function animateCounter(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    if (reduceMotion) {
      el.textContent = target;
      return;
    }
    var duration = 1200;
    var start = null;

    function step(timestamp) {
      if (start === null) start = timestamp;
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        el.textContent = target;
      }
    }
    window.requestAnimationFrame(step);
  }

  if (counters.length) {
    if ("IntersectionObserver" in window) {
      var counterObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              animateCounter(entry.target);
              counterObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach(function (el) { counterObserver.observe(el); });
    } else {
      counters.forEach(animateCounter);
    }
  }

  /* ---------- Sticky header shadow on scroll ---------- */
  var header = document.getElementById("site-header");
  if (header) {
    var lastScrolled = false;
    window.addEventListener(
      "scroll",
      function () {
        var scrolled = window.scrollY > 8;
        if (scrolled !== lastScrolled) {
          header.style.boxShadow = scrolled ? "0 8px 24px -16px rgba(0,0,0,0.5)" : "none";
          lastScrolled = scrolled;
        }
      },
      { passive: true }
    );
  }
})();
