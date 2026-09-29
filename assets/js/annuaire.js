/* CSNCP — annuaire des cliniques (liste filtrable + carte Leaflet) */
(function () {
  "use strict";

  var clinics = JSON.parse(document.getElementById("clinics-data").textContent);
  var t = JSON.parse(document.getElementById("dir-i18n").textContent);
  var q = document.getElementById("q");
  var region = document.getElementById("region");
  var spec = document.getElementById("spec");
  var list = document.getElementById("list");
  var count = document.getElementById("count");
  var map = null;
  var markers = {};

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function norm(s) {
    return String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  // Listes déroulantes (uniquement les valeurs présentes dans les données)
  function fill(select, keys, labels) {
    keys.sort(function (a, b) { return labels[a].localeCompare(labels[b]); }).forEach(function (k) {
      var o = document.createElement("option");
      o.value = k;
      o.textContent = labels[k];
      select.appendChild(o);
    });
  }
  var regions = {}, specs = {};
  clinics.forEach(function (c) {
    regions[c.region] = 1;
    c.specialties.forEach(function (s) { specs[s] = 1; });
  });
  fill(region, Object.keys(regions), t.regions);
  fill(spec, Object.keys(specs), t.specialties);

  var color = "#035FCA";
  function icon(active) {
    return window.L.divIcon({
      className: "",
      iconSize: [22, 22],
      iconAnchor: [11, 11],
      html: '<span style="display:block;width:22px;height:22px;border-radius:50%;background:' +
        (active ? "#F26B5B" : color) + ';border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></span>'
    });
  }

  function card(c) {
    var specsHtml = c.specialties.map(function (s) { return "<li>" + esc(t.specialties[s] || s) + "</li>"; }).join("");
    var contacts = [];
    if (c.phone) contacts.push(t.phone + ' <a href="tel:' + esc(c.phone.replace(/\s/g, "")) + '" dir="ltr">' + esc(c.phone) + "</a>");
    if (c.email) contacts.push('<a href="mailto:' + esc(c.email) + '">' + esc(t.email) + "</a>");
    if (c.web) contacts.push('<a href="' + esc(c.web) + '" rel="noopener" target="_blank">' + esc(t.web) + "</a>");
    if (map) contacts.push('<button type="button" class="locate" data-id="' + esc(c.id) + '">' + esc(t.locate) + "</button>");
    return '<article class="card clinic" id="c-' + esc(c.id) + '">' +
      "<h3>" + esc(c.name) + "</h3>" +
      '<p class="city">' + esc(c.address) + "</p>" +
      '<ul class="specs">' + specsHtml + "</ul>" +
      '<div class="contacts">' + contacts.join("") + "</div></article>";
  }

  function current() {
    var term = norm(q.value.trim());
    return clinics.filter(function (c) {
      if (region.value && c.region !== region.value) return false;
      if (spec.value && c.specialties.indexOf(spec.value) < 0) return false;
      if (term) {
        var hay = norm([c.name, c.city, c.address, t.regions[c.region]].concat(
          c.specialties.map(function (s) { return t.specialties[s]; })).join(" "));
        if (hay.indexOf(term) < 0) return false;
      }
      return true;
    });
  }

  function render() {
    var res = current();
    count.textContent = res.length === 1 ? t.count_one : t.count_many.replace("{n}", res.length);
    list.innerHTML = res.length ? res.map(card).join("") : '<p class="card">' + esc(t.none) + "</p>";
    if (!map) return;
    var ids = {};
    res.forEach(function (c) { ids[c.id] = 1; });
    Object.keys(markers).forEach(function (id) {
      if (ids[id]) markers[id].addTo(map); else markers[id].remove();
    });
    if (res.length) {
      map.fitBounds(window.L.latLngBounds(res.map(function (c) { return [c.lat, c.lng]; })), { padding: [40, 40], maxZoom: 12 });
    }
  }

  function select(id, scroll) {
    document.querySelectorAll(".clinic.active").forEach(function (el) { el.classList.remove("active"); });
    var el = document.getElementById("c-" + id);
    if (el) {
      el.classList.add("active");
      if (scroll) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    Object.keys(markers).forEach(function (k) { markers[k].setIcon(icon(k === id)); });
  }

  list.addEventListener("click", function (e) {
    var btn = e.target.closest(".locate");
    if (!btn || !map) return;
    var m = markers[btn.getAttribute("data-id")];
    map.setView(m.getLatLng(), 14);
    m.openPopup();
    select(btn.getAttribute("data-id"), false);
    if (window.innerWidth < 900) document.getElementById("map").scrollIntoView({ behavior: "smooth" });
  });

  [q, region, spec].forEach(function (el) { el.addEventListener("input", render); });

  function initMap() {
    if (!window.L) {
      // Carte indisponible (hors ligne, CDN bloqué) : la liste reste utilisable seule.
      document.getElementById("map").hidden = true;
      document.querySelector(".dir-layout").classList.add("no-map");
      list.querySelectorAll(".locate").forEach(function (b) { b.hidden = true; });
      return;
    }
    map = window.L.map("map", { scrollWheelZoom: false }).setView([35.2, 9.9], 6);
    window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    clinics.forEach(function (c) {
      markers[c.id] = window.L.marker([c.lat, c.lng], { icon: icon(false), title: c.name })
        .bindPopup("<strong>" + esc(c.name) + "</strong><br>" + esc(c.city))
        .on("click", function () { select(c.id, true); });
    });
    render();
  }

  if (document.readyState === "complete") initMap();
  else window.addEventListener("load", initMap);
  render();
})();
