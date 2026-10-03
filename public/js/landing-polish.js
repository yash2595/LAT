/* InternBoot landing: lean interaction layer (v3)
   Only what helps the visitor: scroll progress, chapter rail, working contact form. */
(() => {
  const $ = (s) => document.querySelector(s);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  /* 2. Chapter rail: tells the visitor where they are in the story */
  const chapters = [["#home", "START"], ["#compare", "01 · WHY LAT"], ["#levels", "02 · YOUR OUTCOME"], ["#how", "03 · HOW IT WORKS"],
    ["#pattern", "04 · THE ASSESSMENT"], ["#fee", "05 · FEE"], ["#faq", "06 · QUESTIONS"]].filter(([s]) => $(s));
  const rail = Object.assign(document.createElement("div"), { className: "fx-rail" });
  rail.setAttribute("aria-hidden", "true");
  chapters.forEach(([s, l]) => { const a = Object.assign(document.createElement("a"), { href: s, tabIndex: -1 }); a.dataset.l = l; rail.appendChild(a); });
  document.body.appendChild(rail);
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      rail.querySelectorAll("a").forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
    }), { rootMargin: "-45% 0px -50% 0px" });
    chapters.forEach(([s]) => io.observe($(s)));
  }

  /* 3. Contact form -> api/contact.php (the old formsubmit.co post was blocked by the page CSP) */
  const form = $("#contactForm"), status = $("#contactStatus");
  if (form) form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const btn = form.querySelector('[type="submit"]'), f = new FormData(form);
    const say = (msg, ok) => { status.textContent = msg; status.className = "contact-status " + (ok ? "ok" : "err"); };
    btn.disabled = true; say("Sending…", true);
    try {
      const res = await fetch("api/contact.php", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: f.get("name"), email: f.get("email"), phone: f.get("phone"), inquiry_type: f.get("subject"), message: f.get("message") })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.status === "error") throw new Error(data.message || "Could not send. Please try again.");
      say(data.message || "Thank you! We'll get back to you shortly.", true); form.reset();
    } catch (err) { say(err.message || "Network error. Please try again.", false); }
    btn.disabled = false;
  });

  /* 4. How it works: live preview follows the active step */
  const steps = [...document.querySelectorAll(".hiw-flow-step")], scenes = [...document.querySelectorAll(".lp-scene")];
  let cur = -1, secs = 3582, timer = 0;
  const show = (i) => {
    if (i === cur || !scenes[i]) return; cur = i;
    steps.forEach((st, k) => st.classList.toggle("lp-active", k === i));
    scenes.forEach((sc, k) => sc.classList.toggle("on", k === i));
    clearInterval(timer);
    if (i === 3 && !reduce) timer = setInterval(() => { secs--; const t = $("#lpTimer"); if (t) t.textContent = String(Math.floor(secs / 60)).padStart(2, "0") + ":" + String(secs % 60).padStart(2, "0"); }, 1000);
  };
  if (steps.length && "IntersectionObserver" in window) {
    const so = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) show(steps.indexOf(e.target)); }), { rootMargin: "-42% 0px -48% 0px" });
    steps.forEach((st) => so.observe(st));
  }

  /* 5. Certificate: tilt + shine on pointer */
  const cert = $("#lpCert");
  if (cert && !reduce) {
    cert.addEventListener("pointermove", (e) => { const r = cert.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      cert.style.setProperty("--ry", x * 14 + "deg"); cert.style.setProperty("--rx", -y * 14 + "deg"); cert.style.setProperty("--sh", x * 140 + "%"); });
    cert.addEventListener("pointerleave", () => { cert.style.setProperty("--rx", "0deg"); cert.style.setProperty("--ry", "0deg"); cert.style.setProperty("--sh", "-120%"); });
  }

  /* 6. Count-up for the assessment facts */
  const nums = [...document.querySelectorAll("[data-count]")];
  if (nums.length && !reduce && "IntersectionObserver" in window) {
    const co = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; co.unobserve(e.target);
      const end = +e.target.dataset.count, t0 = performance.now();
      const step = (n) => { const p = Math.min(1, (n - t0) / 1100); e.target.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }), { threshold: .6 });
    nums.forEach((n) => co.observe(n));
  }

  /* 7. Level staircase: draw in on view, auto-climb, follow hover / tap */
  const lad = $("#lpLadder");
  if (lad) {
    const sts = [...lad.querySelectorAll(".lp-st")], db = $("#lpDb"), dn = $("#lpDn"), ds = $("#lpDs");
    let idx = -1, auto = 0, touched = false;
    const pick = (i) => { idx = i; sts.forEach((s, k) => s.classList.toggle("on", k === i)); const s = sts[i];
      db.textContent = s.dataset.n; dn.textContent = "Level " + s.dataset.n + " · " + s.dataset.nm + " · " + s.dataset.o; ds.textContent = s.dataset.ns; };
    const stop = () => { touched = true; clearInterval(auto); };
    sts.forEach((s, i) => ["pointerenter", "focus", "click"].forEach((ev) => s.addEventListener(ev, () => { stop(); pick(i); })));
    pick(4);
    if ("IntersectionObserver" in window) {
      const lo = new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting) { clearInterval(auto); return; }
        lad.classList.add("in"); if (reduce || touched) return;
        clearInterval(auto); idx = -1;
        auto = setInterval(() => pick(idx < 0 ? 0 : (idx + 1) % 5), 2200);
        pick(0);
      }), { threshold: .35 });
      lo.observe(lad);
    } else lad.classList.add("in");
  }

  /* 7b. Before / after: animate when it enters view */
  const vs = $("#compare");
  if (vs) { if ("IntersectionObserver" in window) { const vo = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { vs.classList.add("in"); vo.disconnect(); } }), { threshold: .3 }); vo.observe(vs); } else vs.classList.add("in"); }

  /* 8. Assessment: hovering a domain highlights its slice of the 100 questions */
  const wrap = $("#patternDeckWrap");
  if (wrap) {
    const cards = [...wrap.querySelectorAll(".pattern-card")], num = wrap.querySelector(".pattern-core-ring b"), share = [30, 40, 30];
    const base = num ? num.textContent : "100";
    const set = (i) => { wrap.dataset.a = i; cards.forEach((c, k) => c.classList.toggle("is-on", k === i)); if (num) num.textContent = share[i]; };
    const clear = () => { delete wrap.dataset.a; cards.forEach((c) => c.classList.remove("is-on")); if (num) num.textContent = base; };
    cards.forEach((c, i) => { c.addEventListener("pointerenter", () => set(i)); c.addEventListener("pointerleave", clear); c.tabIndex = 0; c.addEventListener("focus", () => set(i)); c.addEventListener("blur", clear); });
  }

  /* 9. Hero story: the whole LAT concept in one auto-playing loop */
  const story = $("#lpStory");
  if (story) {
    const steps = [...story.querySelectorAll(".st-step")], scs = [...story.querySelectorAll(".st-scene")], cap = $("#stCap");
    const CAP = ["60 minutes · 100 questions · online", "Your assessed level, from 1 to 5", "Digital certificate, verifiable with a QR", "Opportunities matched to your level"];
    let i = -1, lock = 0, tm = 0, left = 3582;
    const go = (k) => {
      if (k === i) return; i = k;
      steps.forEach((s, n) => { s.classList.toggle("on", n === k); s.classList.toggle("done", n < k); });
      scs.forEach((s, n) => s.classList.toggle("on", n === k));
      story.style.setProperty("--p", k / 3); cap.textContent = CAP[k];
      clearInterval(tm);
      if (k === 0 && !reduce) { left = 3582; tm = setInterval(() => { left--; const t = $("#stTimer"); if (t) t.textContent = String(Math.floor(left / 60)).padStart(2, "0") + ":" + String(left % 60).padStart(2, "0"); }, 1000); }
    };
    steps.forEach((s, n) => s.addEventListener("click", () => { go(n); lock = Date.now() + 10000; }));
    story.addEventListener("pointerenter", () => { lock = Date.now() + 5000; });
    go(0);
    if (!reduce) setInterval(() => { if (document.hidden || Date.now() < lock) return; go((i + 1) % 4); }, 3800);
  }
})();
