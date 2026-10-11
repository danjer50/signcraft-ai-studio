/*
 * Locale detection for the exported 404 page (Milestone 5).
 *
 * Static hosting serves one 404.html for every unknown URL, so the document cannot be
 * rendered per locale on the server (that needed the removed locale-header proxy). This
 * tiny script runs on the 404 page only: it reads the path, finds the locale segment,
 * sets `lang`/`dir` on <html>, shows the matching content variant and swaps the title.
 * Everything is data-driven from data-* attributes; no user input is ever injected.
 * Without JavaScript the page shows the default locale (documented limitation).
 */
(function () {
  "use strict";

  var LOCALES = ["fr", "en", "ar"];
  var DEFAULT_LOCALE = "fr";
  var DIRECTIONS = { fr: "ltr", en: "ltr", ar: "rtl" };

  function localeFromPath(pathname) {
    var segment = pathname.split("/")[1] || "";
    return LOCALES.indexOf(segment) !== -1 ? segment : DEFAULT_LOCALE;
  }

  function apply() {
    var locale = localeFromPath(window.location.pathname);
    var root = document.documentElement;
    root.setAttribute("lang", locale);
    root.setAttribute("dir", DIRECTIONS[locale] || "ltr");

    var variants = document.querySelectorAll("[data-notfound-locale]");
    var visibleTitle = null;
    for (var i = 0; i < variants.length; i += 1) {
      var variant = variants[i];
      var isVisible = variant.getAttribute("data-notfound-locale") === locale;
      if (isVisible) {
        variant.removeAttribute("hidden");
        visibleTitle = variant.getAttribute("data-notfound-title");
      } else {
        variant.setAttribute("hidden", "");
      }
    }
    if (visibleTitle) {
      document.title = visibleTitle;
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply);
  } else {
    apply();
  }
})();
