/* ==========================================================================
   menu-group template — behaviour (vanilla, no deps, no build step)
   ========================================================================== */

/* --------------------------------------------------------------------------
   THE ONE THING TO CHANGE WHEN THE MENU IS READY
   --------------------------------------------------------------------------
   MENU_URL is the SINGLE source for every Order / Order Now / View Menu button
   (they all carry data-menu-link). At go-live, set menu_url in the content JSON
   and re-run generate.mjs (it rewrites the four consts below), OR edit MENU_URL
   here directly — that is the whole change. While MENU_URL is "" or "#", those
   buttons scroll to the on-page menu instead of navigating nowhere.
   generate.mjs overwrites these four lines per site; the values below are the
   valid standalone defaults for hand-editing.
   -------------------------------------------------------------------------- */
const MENU_URL = "#";
const DEFAULT_LOCALE = "fr";
const SITE_LOCALES = ["fr","en"];
const GA_ID = null;

(function () {
  "use strict";

  /* --- THE ORDER SEAM: wire every data-menu-link button to MENU_URL -------- */
  /* Multi-location sites: when the page carries a #loc-modal (emitted by
     generate.mjs from `locations[]`), every order button opens the location
     picker instead — each location has its own ordering URL, so there is no
     single MENU_URL to send everyone to. */
  function wireMenuButtons() {
    var modal = document.getElementById("loc-modal");
    if (modal) {
      var lastFocus = null;
      var openModal = function () { lastFocus = document.activeElement; modal.hidden = false; var f = modal.querySelector(".loc-modal__item"); if (f) f.focus(); };
      var closeModal = function () { modal.hidden = true; if (lastFocus) lastFocus.focus(); };
      document.querySelectorAll("[data-menu-link]").forEach(function (el) {
        el.setAttribute("href", "#locations");
        el.addEventListener("click", function (e) { e.preventDefault(); openModal(); });
      });
      modal.querySelectorAll("[data-loc-close]").forEach(function (el) {
        el.addEventListener("click", closeModal);
      });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) closeModal(); });
      return;
    }
    var live = typeof MENU_URL === "string" && MENU_URL.trim() && MENU_URL.trim() !== "#";
    var target = document.getElementById("signature_dishes") || document.getElementById("menu_pdf");
    document.querySelectorAll("[data-menu-link]").forEach(function (el) {
      if (live) {
        el.setAttribute("href", MENU_URL);
        el.setAttribute("target", "_blank");
        el.setAttribute("rel", "noopener noreferrer");
      } else {
        el.setAttribute("href", target ? "#" + target.id : "#top");
        el.addEventListener("click", function (e) {
          if (target) { e.preventDefault(); target.scrollIntoView({ behavior: "smooth" }); }
        });
      }
    });
  }

  /* --- Bilingual toggle (fr default + _en twins) -------------------------
     Each translatable element carries data-fr and data-en. We swap textContent.
     No dictionary → EN/FR parity is structural (each node owns both strings). */
  function initLang() {
    var buttons = document.querySelectorAll(".lang-btn");
    if (buttons.length === 0) return; // single-locale site: nothing to toggle
    var KEY = "mgLang";
    var lang = localStorage.getItem(KEY) || DEFAULT_LOCALE || "fr";
    function apply(l) {
      lang = l;
      document.documentElement.setAttribute("lang", l);
      document.body.classList.add("lang-transitioning");
      document.querySelectorAll("[data-fr][data-en]").forEach(function (el) {
        var v = el.getAttribute("data-" + l);
        if (v != null) { el.textContent = v; }
      });
      buttons.forEach(function (b) {
        var on = b.getAttribute("data-lang") === l;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      localStorage.setItem(KEY, l);
      setTimeout(function () { document.body.classList.remove("lang-transitioning"); }, 200);
      if (window.gtag) window.gtag("event", "language_switch", { event_category: "engagement", event_label: l.toUpperCase() });
    }
    buttons.forEach(function (b) {
      b.addEventListener("click", function () { apply(b.getAttribute("data-lang")); });
    });
    apply(lang);
  }

  /* --- Sticky header solid-on-scroll ------------------------------------- */
  function initHeader() {
    var h = document.querySelector(".site-header");
    if (!h) return;
    var f = function () { h.classList.toggle("is-scrolled", window.scrollY > 24); };
    f(); window.addEventListener("scroll", f, { passive: true });
  }

  /* --- Mobile sticky call/order bar (show after scroll) ------------------ */
  function initStickyBar() {
    var bar = document.querySelector(".sticky-bar");
    if (!bar) return;
    var f = function () { bar.classList.toggle("show", window.scrollY > 220); };
    f(); window.addEventListener("scroll", f, { passive: true });
  }

  /* --- Reveal on scroll (respects reduced motion) ----------------------- */
  function initReveal() {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var targets = document.querySelectorAll("[data-reveal]");
    if (reduce || !("IntersectionObserver" in window)) {
      targets.forEach(function (t) { t.classList.add("is-visible"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* --- Gallery lightbox --------------------------------------------------- */
  function initLightbox() {
    var thumbs = Array.prototype.slice.call(document.querySelectorAll(".gallery__item img"));
    if (!thumbs.length) return;
    var box = document.createElement("div");
    box.className = "lightbox"; box.setAttribute("aria-hidden", "true");
    box.innerHTML =
      '<button class="lightbox__close" aria-label="Close">×</button>' +
      '<button class="lightbox__nav lightbox__nav--prev" aria-label="Previous">‹</button>' +
      '<img class="lightbox__img" src="" alt="" />' +
      '<button class="lightbox__nav lightbox__nav--next" aria-label="Next">›</button>';
    document.body.appendChild(box);
    var img = box.querySelector(".lightbox__img"), cur = 0;
    function show(i) { cur = (i + thumbs.length) % thumbs.length; img.src = thumbs[cur].src; img.alt = thumbs[cur].alt || ""; }
    function open(i) { show(i); box.classList.add("is-open"); box.setAttribute("aria-hidden", "false"); document.body.classList.add("no-scroll"); }
    function close() { box.classList.remove("is-open"); box.setAttribute("aria-hidden", "true"); document.body.classList.remove("no-scroll"); }
    thumbs.forEach(function (t, i) { t.addEventListener("click", function () { open(i); }); });
    box.querySelector(".lightbox__close").addEventListener("click", close);
    box.querySelector(".lightbox__nav--prev").addEventListener("click", function (e) { e.stopPropagation(); show(cur - 1); });
    box.querySelector(".lightbox__nav--next").addEventListener("click", function (e) { e.stopPropagation(); show(cur + 1); });
    box.addEventListener("click", function (e) { if (e.target === box) close(); });
    document.addEventListener("keydown", function (e) {
      if (!box.classList.contains("is-open")) return;
      if (e.key === "Escape") close(); else if (e.key === "ArrowLeft") show(cur - 1); else if (e.key === "ArrowRight") show(cur + 1);
    });
  }

  /* --- Footer year -------------------------------------------------------- */
  function setYear() { var el = document.getElementById("year"); if (el) el.textContent = new Date().getFullYear(); }

  /* --- GA4 (only when a measurement id was provided) --------------------- */
  function initAnalytics() {
    if (!GA_ID || !window.gtag) return;
    document.querySelectorAll('a[href^="tel:"]').forEach(function (el) {
      el.addEventListener("click", function () { window.gtag("event", "phone_call", { event_category: "engagement" }); });
    });
    document.querySelectorAll("[data-menu-link]").forEach(function (el) {
      el.addEventListener("click", function () { window.gtag("event", "order_click", { event_category: "conversion", event_label: el.textContent.trim() }); });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    wireMenuButtons(); initLang(); initHeader(); initStickyBar(); initReveal(); initLightbox(); setYear(); initAnalytics();
  });
})();


/* --- Rail arrows ----------------------------------------------------------- */
document.querySelectorAll(".rail-wrap").forEach(function (wrap) {
  var rail = wrap.querySelector(".rail");
  var prev = wrap.querySelector(".rail-arrow--prev");
  var next = wrap.querySelector(".rail-arrow--next");
  if (!rail || !prev || !next) return;
  function step() {
    var card = rail.firstElementChild;
    return card ? card.getBoundingClientRect().width + 20 : rail.clientWidth * 0.8;
  }
  function update() {
    prev.disabled = rail.scrollLeft <= 4;
    next.disabled = rail.scrollLeft >= rail.scrollWidth - rail.clientWidth - 4;
  }
  prev.addEventListener("click", function () { rail.scrollBy({ left: -step(), behavior: "smooth" }); });
  next.addEventListener("click", function () { rail.scrollBy({ left: step(), behavior: "smooth" }); });
  rail.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
});
