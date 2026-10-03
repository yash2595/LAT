(() => {
  "use strict";

  const page = document.body;
  if (!page || !page.matches('[data-dashboard="student"], [data-dashboard="admin"]')) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const selector = [
    "main .st",
    "main .st",
    "main .bx",
    "main .tl",
    "main .step",
    'main section[class*="rounded-2xl"][class*="bg-white"]',
    'main section[class*="rounded-xl"][class*="bg-white"]',
    'main div[class*="rounded-2xl"][class*="bg-white"]',
    'main div[class*="rounded-xl"][class*="bg-white"]'
  ].join(",");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    document.querySelectorAll(selector).forEach((element) => {
      element.dataset.scrollReveal = "true";
      element.dataset.scrollVisible = "true";
    });
    return;
  }

  page.dataset.scrollRevealReady = "true";
  let sequence = 0;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.dataset.scrollVisible = "true";
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -44px 0px" });

  function register(root = document) {
    const elements = [];
    if (root instanceof Element && root.matches(selector)) elements.push(root);
    if (root.querySelectorAll) elements.push(...root.querySelectorAll(selector));

    elements.forEach((element) => {
      if (element.dataset.scrollReveal) return;
      if (element.parentElement?.closest("[data-scroll-reveal='true']")) return;
      if (element.closest("[hidden], [aria-hidden='true']")) return;

      element.dataset.scrollReveal = "true";
      element.style.setProperty("--scroll-delay", `${Math.min(sequence % 5, 4) * 55}ms`);
      sequence += 1;

      if (element.getBoundingClientRect().top < window.innerHeight * 0.92) {
        element.dataset.scrollVisible = "true";
      } else {
        observer.observe(element);
      }
    });
  }

  register();

  const content = document.querySelector("main");
  if (content) {
    new MutationObserver((records) => {
      records.forEach((record) => record.addedNodes.forEach((node) => {
        if (node instanceof Element) register(node);
      }));
    }).observe(content, { childList: true, subtree: true });
  }
})();
