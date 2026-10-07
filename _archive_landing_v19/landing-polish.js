/* MYLAT landing polish layer */
(() => {
  const fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $$ = (s) => [...document.querySelectorAll(s)];

  /* 1. Scroll progress bar */
  const bar = Object.assign(document.createElement("div"), { className: "fx-progress" });
  document.body.appendChild(bar);
  let tick = false;
  const paint = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.setProperty("--p", max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0);
    tick = false;
  };
  addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(paint); } }, { passive: true });
  paint();

  /* 2. Hero headline: split into words */
  const title = document.querySelector(".hero-title");
  if (title && !reduce) {
    let i = 0;
    const split = (node) => {
      [...node.childNodes].forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part.trim()) { frag.appendChild(document.createTextNode(part)); return; }
            const s = document.createElement("span");
            s.className = "fx-w"; s.style.setProperty("--i", i++); s.textContent = part;
            frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.classList.contains("text-highlight")) {
          n.classList.add("fx-w"); n.style.setProperty("--i", i++);
        } else if (n.nodeType === 1 && n.tagName !== "BR") split(n);
      });
    };
    split(title);
  }

  /* heading underline alignment follows the heading's own text-align */
  $$(".section-head h2,.hiw-intro-title").forEach((h) => {
    if (getComputedStyle(h).textAlign === "center") h.classList.add("fx-c");
  });

  /* 3. Spotlight glow + lift on cards */
  const cardSel = ".hiw-flow-card,.pattern-card,.fee-card,.compare-card,.accordion-item,#contact .card,.credential-card,.testimonial-card,.cinema-credential";
  $$(cardSel).forEach((el) => {
    el.classList.add("fx-card");
    if (getComputedStyle(el).position === "static") el.style.position = "relative";
    const g = Object.assign(document.createElement("span"), { className: "fx-glow", ariaHidden: "true" });
    el.appendChild(g);
    if (!fine) return;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      g.style.setProperty("--mx", e.clientX - r.left + "px");
      g.style.setProperty("--my", e.clientY - r.top + "px");
    }, { passive: true });
  });

  /* 4. Buttons: shine sweep + magnetic pull */
  $$(".btn-ib-primary,.btn-ib-accent,.btn-ib-ghost,.btn-contact-submit").forEach((b) => {
    b.classList.add("fx-btn");
    b.appendChild(Object.assign(document.createElement("i"), { className: "fx-shine", ariaHidden: "true" }));
    if (!fine || reduce) return;
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      const x = (e.clientX - r.left - r.width / 2) * 0.22;
      const y = (e.clientY - r.top - r.height / 2) * 0.35;
      b.style.translate = `${x}px ${y}px`;
    }, { passive: true });
    b.addEventListener("pointerleave", () => { b.style.transition = "translate .5s cubic-bezier(.16,1,.3,1)"; b.style.translate = "0 0"; });
    b.addEventListener("pointerenter", () => { b.style.transition = "translate .12s linear"; });
  });

  /* 5. Cursor aura (smooth follow) */
  if (fine && !reduce) {
    const aura = Object.assign(document.createElement("div"), { className: "fx-aura", ariaHidden: "true" });
    document.body.appendChild(aura);
    let tx = innerWidth / 2, ty = innerHeight / 2, x = tx, y = ty, raf = 0;
    const loop = () => {
      x += (tx - x) * 0.12; y += (ty - y) * 0.12;
      aura.style.transform = `translate3d(${x}px,${y}px,0)`;
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.5 ? requestAnimationFrame(loop) : 0;
    };
    addEventListener("pointermove", (e) => {
      tx = e.clientX; ty = e.clientY; aura.classList.add("on");
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener("pointerleave", () => aura.classList.remove("on"));
  }
})();

/* ===== v2: creative layer ===== */
(() => {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const div = (cls, html = "") => Object.assign(document.createElement("div"), { className: cls, innerHTML: html });

  /* Level marquee between journey and How-it-works */
  const how = $("#how");
  if (how) {
    const items = ["LEVEL 01 · <b>10+ LPA</b>", "LEVEL 02 · <b>5–10 LPA</b>", "LEVEL 03 · <b>UP TO 5 LPA</b>", "LEVEL 04 · <b>PAID INTERNSHIP</b>", "LEVEL 05 · <b>TRAINING → INTERNSHIP</b>"];
    const row = items.map((t) => `${t}<em>✦</em>`).join("");
    const m = div("fx-marquee", `<div class="fx-band"><div class="fx-track"><span>${row}${row}</span><span>${row}${row}</span></div></div>`);
    m.setAttribute("aria-hidden", "true");
    how.before(m);
  }

  /* Fee card orbit border + drifting blobs */
  $(".fee-card")?.appendChild(div("fx-orbit"));
  ["#fee", "#faq"].forEach((id) => {
    const s = $(id); if (!s) return;
    s.classList.add("fx-sec");
    s.prepend(div("fx-blob a"), div("fx-blob b"));
  });

  /* CTA floating level chips */
  const cta = $(".ib-cta");
  if (cta) {
    [["1", "10+ LPA", "6%", "18%", "0s"], ["2", "5–10 LPA", "14%", "70%", "-2s"], ["3", "UP TO 5 LPA", "80%", "14%", "-4s"],
     ["4", "PAID INTERNSHIP", "84%", "66%", "-1s"], ["5", "TRAINING", "30%", "78%", "-3s"]].forEach(([n, t, x, y, d]) => {
      const c = div("fx-lv", `<b>${n}</b>${t}`);
      c.style.cssText = `left:${x};top:${y};animation-delay:${d}`;
      c.setAttribute("aria-hidden", "true"); cta.appendChild(c);
    });
  }

  /* Footer watermark */
  $(".ib-footer")?.appendChild(div("fx-wm", "<i>MYLAT</i>")).setAttribute("aria-hidden", "true");

  /* Section rail */
  const secs = [["#home", "HERO"], ["#compare", "WITH vs WITHOUT LAT"], ["#placement", "PLACEMENT"], ["#how", "HOW IT WORKS"], ["#levels", "LEVELS"], ["#pattern", "ASSESSMENT"], ["#fee", "FEE"], ["#faq", "FAQS"]].filter(([s]) => $(s));
  const rail = div("fx-rail");
  rail.setAttribute("aria-hidden", "true");
  secs.forEach(([s, l]) => { const a = Object.assign(document.createElement("a"), { href: s }); a.dataset.l = l; rail.appendChild(a); });
  document.body.appendChild(rail);
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      rail.querySelectorAll("a").forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
    }), { rootMargin: "-45% 0px -50% 0px" });
    secs.forEach(([s]) => io.observe($(s)));
  }

  /* Parallax drift on background shapes */
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const par = [[".hiw-mesh--a", -0.08], [".hiw-mesh--b", 0.07], [".hiw-mesh--c", -0.05], [".runway-ambient-a", 0.06], [".runway-ambient-b", -0.06]]
      .map(([s, k]) => [$(s), k]).filter(([e]) => e);
    let t = false;
    addEventListener("scroll", () => {
      if (t) return; t = true;
      requestAnimationFrame(() => {
        par.forEach(([e, k]) => { const r = e.getBoundingClientRect(); e.style.translate = `0 ${((r.top + r.height / 2) - innerHeight / 2) * k}px`; });
        t = false;
      });
    }, { passive: true });
  }
})();
