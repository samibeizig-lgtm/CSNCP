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

  // Sous-menus : ouverture au clic sur l'intitulé
  function closeSubs(except) {
    document.querySelectorAll(".has-sub.open").forEach(function (li) {
      if (li === except) return;
      li.classList.remove("open");
      li.querySelector(".sub-trigger").setAttribute("aria-expanded", "false");
    });
  }
  document.querySelectorAll(".sub-trigger").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var li = btn.parentNode;
      var open = !li.classList.contains("open");
      closeSubs(li);
      li.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".has-sub")) closeSubs(null);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeSubs(null);
  });
  document.querySelectorAll(".submenu a").forEach(function (a) {
    a.addEventListener("click", function () {
      closeSubs(null);
      if (menu && menu.classList.contains("open")) {
        toggle.setAttribute("aria-expanded", "false");
        menu.classList.remove("open");
      }
    });
  });

  // Apparition au défilement
  var revealSel = ".section-head, .card, .member, .block > h2, .timeline li, .steps li";
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

  // Chiffres clés : comptage depuis 0 à l'arrivée dans l'écran
  // (les nombres après « / » restent fixes : 2/3 compte de 0/3 à 2/3)
  var numRe = /(^|[^\/\d])(\d[\d\s\u202f\u00a0]*\d|\d)/g;
  function fmt(n) { return n >= 1000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, "\u202f") : String(n); }
  function render(el, ratio) {
    el.textContent = el.dataset.final.replace(numRe, function (m, pre, num) {
      return pre + fmt(Math.round(parseInt(num.replace(/\D/g, ""), 10) * ratio));
    });
  }
  function countUp(el) {
    var start = null, dur = 1800;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      render(el, 1 - Math.pow(1 - p, 3));
      if (p < 1) requestAnimationFrame(frame); else el.textContent = el.dataset.final;
    }
    requestAnimationFrame(frame);
  }
  var figs = document.querySelectorAll(".figure strong");
  if (figs.length && "IntersectionObserver" in window) {
    figs.forEach(function (f) { f.dataset.final = f.textContent; render(f, 0); });
    var io3 = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { countUp(en.target); io3.unobserve(en.target); }
      });
    }, { threshold: 0.4 });
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
