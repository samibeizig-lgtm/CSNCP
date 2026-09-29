/* CSNCP — interactions communes */
(function () {
  "use strict";

  // Menu mobile
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      menu.classList.toggle("open", !open);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.classList.contains("open")) {
        toggle.setAttribute("aria-expanded", "false");
        menu.classList.remove("open");
        toggle.focus();
      }
    });
  }

  var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Sous-menus (clic, clavier, mobile)
  document.querySelectorAll(".sub-toggle").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var li = btn.parentNode;
      var open = !li.classList.contains("open");
      li.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
  });
  document.addEventListener("click", function (e) {
    document.querySelectorAll(".has-sub.open").forEach(function (li) {
      if (!li.contains(e.target)) {
        li.classList.remove("open");
        li.querySelector(".sub-toggle").setAttribute("aria-expanded", "false");
      }
    });
  });
  document.querySelectorAll(".submenu a").forEach(function (a) {
    a.addEventListener("click", function () {
      if (menu && menu.classList.contains("open")) {
        toggle.setAttribute("aria-expanded", "false");
        menu.classList.remove("open");
      }
    });
  });

  // Photos : fond de repli si l'image ne se charge pas
  document.querySelectorAll(".photo img").forEach(function (img) {
    function broken() { img.closest(".photo").classList.add("broken"); }
    if (img.complete && img.naturalWidth === 0) broken();
    img.addEventListener("error", broken);
  });

  // Apparition au défilement
  var revealSel = ".section-head, .card, .figure, .photo, .member, .block > h2, .timeline li, .steps li";
  var io2 = "IntersectionObserver" in window && !reduced ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); io2.unobserve(en.target); }
    });
  }, { rootMargin: "0px 0px -8% 0px" }) : null;
  if (io2) {
    document.querySelectorAll(revealSel).forEach(function (el, i) {
      var r = el.getBoundingClientRect();
      el.classList.add("reveal");
      if (r.top < window.innerHeight) { el.classList.add("in"); return; }
      el.style.transitionDelay = (i % 3) * 80 + "ms";
      io2.observe(el);
    });
  }

  // Chiffres clés : animation de comptage
  function countUp(el) {
    var original = el.textContent;
    var re = /\d[\d\s\u202f\u00a0]*\d|\d/g;
    var nums = (original.match(re) || []).map(function (n) { return parseInt(n.replace(/\D/g, ""), 10); });
    if (!nums.length || reduced) return;
    var start = null, dur = 1600;
    function fmt(n) { return n >= 1000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f") : String(n); }
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1), e = 1 - Math.pow(1 - p, 3), k = 0;
      el.textContent = original.replace(re, function () { return fmt(Math.round(nums[k++] * e)); });
      if (p < 1) requestAnimationFrame(frame); else el.textContent = original;
    }
    requestAnimationFrame(frame);
  }
  var figs = document.querySelectorAll(".figure strong");
  if (figs.length && "IntersectionObserver" in window) {
    var io3 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { countUp(en.target); io3.unobserve(en.target); }
      });
    }, { threshold: 0.6 });
    figs.forEach(function (f) { io3.observe(f); });
  }

  // Curseur personnalisé (souris uniquement)
  if (!reduced && window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    var dot = document.createElement("div"), ring = document.createElement("div");
    dot.className = "cursor-dot"; ring.className = "cursor-ring";
    dot.setAttribute("aria-hidden", "true"); ring.setAttribute("aria-hidden", "true");
    document.body.appendChild(dot); document.body.appendChild(ring);
    var mx = 0, my = 0, rx = 0, ry = 0, running = false;
    function loop() {
      rx += (mx - rx) * 0.18; ry += (my - ry) * 0.18;
      ring.style.transform = "translate(" + (rx - ring.offsetWidth / 2) + "px," + (ry - ring.offsetHeight / 2) + "px)";
      if (Math.abs(mx - rx) > 0.1 || Math.abs(my - ry) > 0.1) requestAnimationFrame(loop); else running = false;
    }
    document.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = "translate(" + (mx - 4) + "px," + (my - 4) + "px)";
      document.body.classList.add("has-cursor");
      if (!running) { running = true; requestAnimationFrame(loop); }
    });
    document.addEventListener("mouseleave", function () { document.body.classList.remove("has-cursor"); });
    document.addEventListener("mousedown", function () { ring.classList.add("down"); });
    document.addEventListener("mouseup", function () { ring.classList.remove("down"); });
    document.addEventListener("mouseover", function (e) {
      ring.classList.toggle("hover", !!e.target.closest("a, button, select, input, textarea, label, .card.link-card"));
    });
  }

  // Filtre des actualités
  var chips = document.querySelectorAll(".filters .chip");
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      var type = chip.getAttribute("data-filter");
      chips.forEach(function (c) { c.setAttribute("aria-pressed", String(c === chip)); });
      document.querySelectorAll("#news-list .news-card").forEach(function (card) {
        card.hidden = !!type && card.getAttribute("data-type") !== type;
      });
    });
  });

  // Sommaire : section active
  var tocLinks = document.querySelectorAll(".toc a");
  if (tocLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    tocLinks.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          tocLinks.forEach(function (a) { a.classList.remove("active"); });
          var link = byId[en.target.id];
          if (link) link.classList.add("active");
        }
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    Object.keys(byId).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) io.observe(el);
    });
  }

  // Formulaire de contact : objet pré-rempli via ?objet=
  var objet = document.getElementById("objet");
  if (objet) {
    var m = /[?&]objet=([a-z]+)/.exec(location.search);
    if (m && objet.querySelector('option[value="' + m[1] + '"]')) objet.value = m[1];
  }
})();
