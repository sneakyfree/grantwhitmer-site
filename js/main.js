// grantwhitmer.com — interactions
(function () {
  "use strict";

  // year
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  // nav scrolled state
  var nav = document.getElementById("nav");
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // mobile menu
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      links.classList.toggle("open");
    });
    links.addEventListener("click", function (e) {
      if (e.target.tagName === "A") links.classList.remove("open");
    });
  }

  // reveal on scroll
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  // async form submit (inquiry + newsletter) with inline status;
  // no-JS visitors still get the native POST → /thanks.html redirect
  function wireForm(id, successMsg) {
    var form = document.getElementById(id);
    if (!form || !window.fetch) return;
    var status = form.querySelector(".form-status");
    var button = form.querySelector("button[type=submit]");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (status) { status.textContent = "Sending…"; status.className = "form-status"; }
      if (button) button.disabled = true;
      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (status) {
            status.textContent = d.message || (d.ok ? successMsg : "Something went wrong — try again.");
            status.className = "form-status " + (d.ok ? "ok" : "err");
          }
          if (d.ok) form.reset();
          if (button) button.disabled = false;
        })
        .catch(function () {
          if (status) {
            status.textContent = "Couldn't send — check your connection, or email grant@grantwhitmer.com.";
            status.className = "form-status err";
          }
          if (button) button.disabled = false;
        });
    });
  }
  wireForm("inquiryForm", "Sent — Grant will reply personally.");
  wireForm("briefForm", "You're in — welcome aboard.");

  // scroll progress line
  var bar = document.getElementById("scrollBar");
  if (bar) {
    var updateBar = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ")";
    };
    window.addEventListener("scroll", updateBar, { passive: true });
    window.addEventListener("resize", updateBar, { passive: true });
    updateBar();
  }

  // count-up on the credibility numbers (once, when the strip scrolls in)
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cred = document.querySelector(".cred-inner");
  if (cred && !reduceMotion && "IntersectionObserver" in window) {
    var credIO = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      credIO.disconnect();
      cred.querySelectorAll(".n b").forEach(function (el) {
        var m = el.textContent.match(/^(\d+)(.*)$/);
        if (!m) return;
        var target = parseInt(m[1], 10), suffix = m[2], start = null;
        var step = function (ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / 900, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    credIO.observe(cred);
  }

  // Booking: Windy Calendar is a plain iframe (no third-party script needed).

  // sticky Book CTA: appears on deep scroll, hides while booking/newsletter are in view
  var cta = document.getElementById("stickyCta");
  if (cta) {
    var inView = {};
    var nearForms = false;
    if ("IntersectionObserver" in window) {
      var formsIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { inView[en.target.id] = en.isIntersecting; });
        nearForms = !!(inView.book || inView.windstorm);
        update();
      }, { rootMargin: "0px 0px -12% 0px" });
      ["book", "windstorm"].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) formsIO.observe(el);
      });
    }
    var update = function () {
      var show = window.scrollY > 1400 && !nearForms;
      cta.classList.toggle("show", show);
      cta.setAttribute("aria-hidden", show ? "false" : "true");
      cta.tabIndex = show ? 0 : -1;
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
  }
})();
