(() => {
  const story = document.querySelector(".career-journey");
  const stage = story?.querySelector(".journey-sticky");
  if (story && stage) {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let scheduled = false;

    const paintJourney = () => {
      const bounds = story.getBoundingClientRect();
      const scrollable = Math.max(1, story.offsetHeight - window.innerHeight);
      const progress = reducedMotion ? 1 : Math.max(0, Math.min(1, -bounds.top / scrollable));
      stage.style.setProperty("--journey", progress.toFixed(4));
      stage.style.setProperty("--bright", Math.max(0, Math.min(1, (progress - 0.2) / 0.52)).toFixed(4));
      stage.dataset.journeyProgress = progress.toFixed(3);
      scheduled = false;
    };

    const requestPaint = () => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(paintJourney);
    };
    window.addEventListener("scroll", requestPaint, { passive: true });
    window.addEventListener("resize", requestPaint, { passive: true });
    paintJourney();
  }

  const floatingApply = document.querySelector(".floating-apply-btn");
  if (floatingApply) {
    const updateFloatingApply = () => floatingApply.classList.toggle("landing-visible", window.scrollY > window.innerHeight * 1.15);
    window.addEventListener("scroll", updateFloatingApply, { passive: true });
    updateFloatingApply();
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealTargets = document.querySelectorAll(
    ".section-head, .section > .container > .row, .section > .container > .text-center, .proof-heading, .testimonial-card, .credential-card, .company-track > span, .hiw-flow-step, .level-card, .pattern-card, .fee-card, #contact .card, .accordion-item, .ib-cta .container"
  );
  if (!reduceMotion && "IntersectionObserver" in window) {
    revealTargets.forEach((element, index) => {
      element.classList.add("scroll-reveal");
      element.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 75}ms`);
    });
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -5% 0px" });
    revealTargets.forEach((element) => observer.observe(element));
  }
})();
