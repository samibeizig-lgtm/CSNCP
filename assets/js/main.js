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
