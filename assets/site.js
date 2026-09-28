/* integrativ · fælles script: menu, gamle links, baggrundslinjer */
(function () {
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Gamle links fra den tidligere side (#/priser osv.) sendes til de nye sider
  var old = { "#/rammen": "rammen.html", "#/analyser": "analyser.html", "#/priser": "priser.html", "#/book": "kontakt.html" };
  if (old[location.hash]) location.replace(old[location.hash]);

  // Mobilmenu
  var head = document.querySelector(".site-head");
  var burger = document.querySelector(".burger");
  if (head && burger) {
    burger.addEventListener("click", function () {
      var open = head.classList.toggle("open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      burger.lastChild.nodeValue = open ? (document.documentElement.lang.indexOf("en") === 0 ? "Close" : "Luk") : "Menu";
    });
    head.querySelectorAll(".mnav a").forEach(function (a) {
      a.addEventListener("click", function () { head.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); burger.lastChild.nodeValue = "Menu"; });
    });
  }

  // Ankerlinks scroller under den faste topbar
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href").slice(1);
    var t = id && document.getElementById(id);
    if (!t) return;
    e.preventDefault();
    window.scrollTo({ top: t.getBoundingClientRect().top + window.pageYOffset - 70, behavior: reduce ? "auto" : "smooth" });
    history.replaceState(null, "", "#" + id);
  });

  var dpr = Math.min(window.devicePixelRatio || 1, 2);

  // Topografiske ringe i forsidens hero
  var c = document.getElementById("field");
  if (c) {
    var ctx = c.getContext("2d"), S = 0, phase = 0;
    var size = function () {
      var hero = c.closest("section");
      var hh = (hero && hero.offsetHeight) || Math.round(window.innerHeight * 0.86) || 600;
      S = Math.min(Math.max(hh * 1.02, 300), 920, window.innerWidth * 1.05);
      c.style.width = S + "px"; c.style.height = S + "px";
      c.width = S * dpr; c.height = S * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    var ring = function (cx, cy, R, k) {
      ctx.beginPath();
      for (var i = 0; i <= 200; i++) {
        var a = i / 200 * Math.PI * 2;
        var d = R * (1 + 0.105 * Math.sin(3 * a + phase + k * 0.34) + 0.058 * Math.sin(5 * a - phase * 0.6 + k * 0.21) + 0.030 * Math.sin(8 * a + phase * 1.1 + k * 0.11));
        var x = cx + Math.cos(a) * d * 1.14, y = cy + Math.sin(a) * d * 0.88;
        i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath(); ctx.stroke();
    };
    var draw = function () {
      ctx.clearRect(0, 0, S, S); ctx.lineWidth = 1;
      for (var k = 1; k <= 52; k++) {
        var t = k / 52;
        ctx.strokeStyle = "rgba(44,92,127," + (0.045 + 0.055 * Math.pow(1 - t, 1.7)) + ")";
        ring(S / 2, S / 2, S * 0.475 * t, k);
      }
    };
    size(); draw();
    var ft; window.addEventListener("resize", function () { clearTimeout(ft); ft = setTimeout(function () { size(); draw(); }, 140); });
    if (!reduce) (function loop() { phase += 0.0013; draw(); requestAnimationFrame(loop); })();
  }

  // Relieflinjer i sidefoden
  var r = document.getElementById("relief");
  if (r) {
    var rc = r.getContext("2d"), W = 0, H = 0, ph = 2.4, live = false;
    var fo = document.querySelector(".site-foot");
    var rsize = function () { W = fo.offsetWidth; H = fo.offsetHeight; r.width = W * dpr; r.height = H * dpr; rc.setTransform(dpr, 0, 0, dpr, 0, 0); };
    var rdraw = function () {
      rc.clearRect(0, 0, W, H); rc.lineWidth = 1;
      var Rmax = W * 1.15, cx = W * 0.5, cy = H + 0.62 * Rmax, rTop = cy - H * 1.10, rBot = cy + H * 0.03, N = 98;
      var gap = (rBot - rTop) / N, A = gap * 0.42, a0 = -Math.PI / 2 - 1.0, a1 = -Math.PI / 2 + 1.0;
      for (var k = 0; k <= N; k++) {
        var t = k / N, R = rTop + gap * k;
        rc.strokeStyle = "rgba(44,92,127," + (0.044 + 0.048 * Math.pow(1 - t, 1.5)) + ")";
        rc.beginPath();
        for (var i = 0; i <= 440; i++) {
          var ang = a0 + (a1 - a0) * i / 440;
          var d = R + A * (Math.sin(3 * ang + ph + k * 0.34) + 0.55 * Math.sin(5 * ang - ph * 0.6 + k * 0.21) + 0.30 * Math.sin(8 * ang + ph * 1.1 + k * 0.11));
          var x = cx + Math.cos(ang) * d, y = cy + Math.sin(ang) * d;
          i ? rc.lineTo(x, y) : rc.moveTo(x, y);
        }
        rc.stroke();
      }
    };
    rsize(); rdraw();
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { rsize(); rdraw(); }, 160); });
    if (!reduce && "IntersectionObserver" in window) {
      var loop = function () { if (!live) return; ph += 0.0013; rdraw(); requestAnimationFrame(loop); };
      new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting) { if (!live) { live = true; requestAnimationFrame(loop); } } else live = false; });
      }).observe(fo);
    }
  }
})();

/* Kontaktformular: vis kvittering efter afsendelse (kontakt.php sender tilbage med ?sendt=1 eller ?fejl=1) */
(function () {
  var f = document.getElementById("kontaktform");
  if (!f) return;
  var q = location.search;
  var ok = document.getElementById("form-ok"), err = document.getElementById("form-fejl");
  if (/sendt=1/.test(q) && ok) { ok.hidden = false; f.hidden = true; }
  if (/fejl=1/.test(q) && err) err.hidden = false;
})();

/* Kontaktformular uden server (GitHub Pages): åbner besøgendes mailprogram med beskeden udfyldt */
(function () {
  var f = document.getElementById("kontaktform");
  if (!f || !f.hasAttribute("data-mailto")) return;
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
    var body = "Navn: " + v("navn") + "\nTelefon: " + v("telefon") + "\nE-mail: " + v("email") + "\n\n" + v("besked");
    location.href = "mailto:" + f.getAttribute("data-mailto") + "?subject=" + encodeURIComponent("Henvendelse via integrativlaege.dk: " + v("navn")) + "&body=" + encodeURIComponent(body);
    var ok = document.getElementById("form-ok");
    if (ok) { ok.querySelector("b").textContent = "Din mail er klar til afsendelse"; ok.querySelector("p").textContent = "Dit mailprogram er åbnet med beskeden udfyldt. Tryk send dér. Åbnede der ikke noget, så skriv til integrativlaege@pm.me eller ring på 60 90 95 24."; ok.hidden = false; }
  });
})();
