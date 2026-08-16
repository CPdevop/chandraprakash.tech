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

  /* ---------- Data Trust Score widget ---------- */
  var tsWidget = document.getElementById("tsWidget");
  if (tsWidget) {
    var tsQuestions = Array.prototype.slice.call(tsWidget.querySelectorAll(".ts-question"));
    var tsTotal = tsQuestions.length;
    var tsAnswers = new Array(tsTotal).fill(null);
    var tsCurrent = 0;

    var tsProgressBar = document.getElementById("tsProgressBar");
    var tsStepCount = document.getElementById("tsStepCount");
    var tsResult = document.getElementById("tsResult");
    var tsNav = document.getElementById("tsNav");
    var tsBack = document.getElementById("tsBack");
    var tsRetake = document.getElementById("tsRetake");

    var tsBands = [
      {
        max: 7,
        label: "Fragile Trust",
        message: "More people are quietly double-checking this data than actually relying on it. That usually means the basics, ingestion, cleaning and validation, need attention before governance can hold up on top of them."
      },
      {
        max: 11,
        label: "Gaps Forming",
        message: "Parts of this pipeline hold up well. Others don't, and it's often unclear which is which until something breaks. That gap is usually where quality checks and clearer ownership pay off fastest."
      },
      {
        max: 16,
        label: "Strong Foundation",
        message: "The fundamentals are in good shape. The next step is usually formalizing governance and monitoring so this holds up as the team, sources and volume keep growing."
      }
    ];

    function tsShowQuestion(index) {
      tsQuestions.forEach(function (q, i) {
        q.hidden = i !== index;
      });
      tsResult.hidden = true;
      tsNav.hidden = false;
      var pct = ((index + 1) / tsTotal) * 100;
      tsProgressBar.style.width = pct + "%";
      tsStepCount.textContent = "Question " + (index + 1) + " of " + tsTotal;
      tsBack.disabled = index === 0;
    }

    function tsShowResult() {
      var score = tsAnswers.reduce(function (sum, v) { return sum + (v === null ? 0 : v); }, 0);
      var band = tsBands[tsBands.length - 1];
      for (var i = 0; i < tsBands.length; i++) {
        if (score <= tsBands[i].max) { band = tsBands[i]; break; }
      }

      tsQuestions.forEach(function (q) { q.hidden = true; });
      tsNav.hidden = true;
      tsResult.hidden = false;
      tsProgressBar.style.width = "100%";
      tsStepCount.textContent = "Result";

      document.getElementById("tsResultLabel").textContent = band.label;
      document.getElementById("tsResultMessage").textContent = band.message;

      var scoreEl = document.getElementById("tsScoreValue");
      var fillEl = document.getElementById("tsMeterFill");

      if (reduceMotion) {
        scoreEl.textContent = score;
      } else {
        var start = null;
        var duration = 700;
        function step(ts) {
          if (start === null) start = ts;
          var progress = Math.min((ts - start) / duration, 1);
          scoreEl.textContent = Math.round(progress * score);
          if (progress < 1) window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
      }
      requestAnimationFrame(function () {
        fillEl.style.width = (score / 16) * 100 + "%";
      });
    }

    tsQuestions.forEach(function (q, index) {
      q.addEventListener("change", function (e) {
        if (e.target.type !== "radio") return;
        tsAnswers[index] = parseInt(e.target.value, 10);
        setTimeout(
          function () {
            if (index === tsTotal - 1) {
              tsShowResult();
            } else {
              tsCurrent = index + 1;
              tsShowQuestion(tsCurrent);
            }
          },
          reduceMotion ? 0 : 320
        );
      });
    });

    tsBack.addEventListener("click", function () {
      if (tsCurrent > 0) {
        tsCurrent -= 1;
        tsShowQuestion(tsCurrent);
      }
    });

    tsRetake.addEventListener("click", function () {
      tsAnswers = new Array(tsTotal).fill(null);
      tsCurrent = 0;
      tsQuestions.forEach(function (q) {
        q.querySelectorAll("input[type=radio]").forEach(function (input) { input.checked = false; });
      });
      tsShowQuestion(0);
    });

    tsShowQuestion(0);
  }

  /* ---------- Data Quality Dimensions wheel ---------- */
  var dqWheel = document.getElementById("dqWheel");
  if (dqWheel) {
    var dqSvg = document.getElementById("dqWheelSvg");
    var dqNodes = Array.prototype.slice.call(dqWheel.querySelectorAll(".dq-node"));

    function layoutDqWheel() {
      var size = dqWheel.clientWidth;
      if (!size) return;
      var cx = size / 2;
      var cy = size / 2;
      var radius = size / 2 * 0.82;
      var n = dqNodes.length;
      var svgLines = "";

      dqNodes.forEach(function (node, i) {
        var angle = (-90 + i * (360 / n)) * (Math.PI / 180);
        var x = cx + radius * Math.cos(angle);
        var y = cy + radius * Math.sin(angle);
        node.style.left = x + "px";
        node.style.top = y + "px";
        svgLines += '<line x1="' + cx + '" y1="' + cy + '" x2="' + x + '" y2="' + y + '"></line>';
      });

      dqSvg.setAttribute("viewBox", "0 0 " + size + " " + size);
      dqSvg.innerHTML = svgLines;
    }

    layoutDqWheel();
    window.addEventListener("resize", debounce(layoutDqWheel, 150));

    if ("IntersectionObserver" in window) {
      var dqObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              layoutDqWheel();
              dqObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2 }
      );
      dqObserver.observe(dqWheel);
    }
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      var args = arguments;
      t = setTimeout(function () { fn.apply(null, args); }, wait);
    };
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
