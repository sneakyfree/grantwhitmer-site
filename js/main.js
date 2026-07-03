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

  // inquiry form: graceful fallback to mailto if Formspree not yet configured
  var form = document.getElementById("inquiryForm");
  if (form) {
    form.addEventListener("submit", function (e) {
      if (form.action.indexOf("YOUR_FORM_ID") !== -1) {
        e.preventDefault();
        var d = new FormData(form);
        var subject = encodeURIComponent("Booking inquiry: " + (d.get("engagement") || ""));
        var body = encodeURIComponent(
          "Name: " + (d.get("name") || "") + "\n" +
          "Email: " + (d.get("email") || "") + "\n" +
          "Organization: " + (d.get("organization") || "") + "\n" +
          "Engagement: " + (d.get("engagement") || "") + "\n\n" +
          (d.get("message") || "")
        );
        window.location.href =
          "mailto:grant@windstorminstitute.org?subject=" + subject + "&body=" + body;
      }
    });
  }
})();
