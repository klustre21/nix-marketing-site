/* NIX marketing site — scroll reveals, count-ups, nav state */

(function () {
  "use strict";

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- nav border on scroll ---- */
  var nav = document.getElementById("nav");
  function onScroll() {
    nav.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---- count-up animation ---- */
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var duration = parseInt(el.getAttribute("data-duration"), 10) || 1200;
    if (reducedMotion) {
      el.textContent = target.toLocaleString("en-US");
      return;
    }
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      el.textContent = Math.round(target * eased).toLocaleString("en-US");
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ---- reveal + trigger observers ---- */
  var revealables = document.querySelectorAll(
    ".reveal, .card, .score-card, .taper-chart"
  );

  var counted = new WeakSet();

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");

        entry.target.querySelectorAll("[data-count]").forEach(function (el) {
          if (counted.has(el)) return;
          counted.add(el);
          countUp(el);
        });

        io.unobserve(entry.target);
      });
    },
    { threshold: 0.25, rootMargin: "0px 0px -40px 0px" }
  );

  revealables.forEach(function (el) {
    io.observe(el);
  });

  /* hero elements are above the fold — reveal immediately */
  document.querySelectorAll(".hero .reveal").forEach(function (el) {
    el.classList.add("visible");
  });

  /* ---- SOS breathing engine (mirrors the in-app exercise) ----
     4s inhale (circle grows) → 4s hold → 6s exhale (circle shrinks),
     6 cycles per session; the outer arc tracks overall session progress. */
  (function () {
    var core = document.getElementById("breath-core");
    var word = document.getElementById("breath-word");
    var count = document.getElementById("breath-count");
    var caption = document.getElementById("breath-caption");
    var cycleLabel = document.getElementById("breath-cycle");
    var arc = document.getElementById("breath-arc");
    if (!core || reducedMotion) return;

    var CIRC = 615.75;
    var CAPTION_IN = "The urge peaks at 90 seconds, then it falls.";
    var CAPTION_OUT = "You’re not giving something up. You’re getting your baseline back.";
    var phases = [
      { label: "Breathe in", secs: 4, scale: 1, caption: CAPTION_IN },
      { label: "Hold", secs: 4, scale: 1, caption: CAPTION_IN },
      { label: "Breathe out", secs: 6, scale: 0.74, caption: CAPTION_OUT }
    ];
    var CYCLE_SECS = 14;
    var CYCLES = 6;
    var cycle = 0;
    var phaseIdx = 0;
    var countTimer = null;

    function setArc(progress, secs) {
      arc.style.transition = secs ? "stroke-dashoffset " + secs + "s linear" : "none";
      arc.style.strokeDashoffset = CIRC * (1 - progress);
    }

    function startPhase() {
      var phase = phases[phaseIdx];
      word.textContent = phase.label;
      caption.textContent = phase.caption;
      cycleLabel.textContent = "CYCLE " + (cycle + 1) + " OF " + CYCLES;

      core.style.transition = "transform " + phase.secs + "s cubic-bezier(0.45, 0, 0.35, 1)";
      core.style.transform = "scale(" + phase.scale + ")";

      var elapsedAtEnd = phases.slice(0, phaseIdx + 1).reduce(function (s, p) { return s + p.secs; }, 0);
      setArc((cycle + elapsedAtEnd / CYCLE_SECS) / CYCLES, phase.secs);

      var remaining = phase.secs;
      count.textContent = remaining;
      clearInterval(countTimer);
      countTimer = setInterval(function () {
        remaining -= 1;
        if (remaining >= 1) count.textContent = remaining;
      }, 1000);

      setTimeout(function () {
        phaseIdx += 1;
        if (phaseIdx >= phases.length) {
          phaseIdx = 0;
          cycle = (cycle + 1) % CYCLES;
          if (cycle === 0) setArc(0, 0);
        }
        startPhase();
      }, phase.secs * 1000);
    }

    setArc(0, 0);
    startPhase();
  })();
})();
