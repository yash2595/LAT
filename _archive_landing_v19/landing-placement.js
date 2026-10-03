/* Placement Arena: pick a LAT level, watch the placement path change */
(() => {
  const how = document.querySelector("#how");
  if (!how) return;
  const L = [
    { c: "#ffb15c", n: "Top / Excellent", b: "10+ LPA", s: ["Level verified", "Profile surfaced first", "Interview invite", "Placement offer"], v: 5, d: "Placement opportunities in the 10+ LPA band", lbl: "10+ LPA" },
    { c: "#8fb0ff", n: "Intermediate", b: "5–10 LPA", s: ["Level verified", "Profile surfaced", "Interview invite", "Placement offer"], v: 4, d: "Placement opportunities in the 5–10 LPA band", lbl: "5–10 LPA" },
    { c: "#6ee7b7", n: "Basic / Employable", b: "UP TO 5 LPA", s: ["Level verified", "Profile surfaced", "Interview invite", "Placement offer"], v: 3, d: "Employable-level roles up to 5 LPA", lbl: "Up to 5 LPA" },
    { c: "#c79bff", n: "Basic Knowledge", b: "PAID INTERN", s: ["Level verified", "Profile surfaced", "Paid internship", "Growth path"], v: 2, d: "Start with a paid internship", lbl: "Paid internship" },
    { c: "#ff8fa3", n: "Needs Training", b: "TRAIN → INTERN", s: ["Level verified", "Guided training", "Internship", "Growth path"], v: 1, d: "Training first, then an internship", lbl: "Training → internship" }
  ];
  const pos = [[8, 46], [78, 14], [86, 62], [30, 84], [16, 18], [60, 88]];
  const sec = document.createElement("section");
  sec.className = "pa"; sec.id = "placement";
  sec.innerHTML = `<div class="pa-aurora"></div><div class="pa-grid"></div><div class="pa-wrap">
  <div><span class="pa-kick"><i></i>PLACEMENT · THE FINAL MOTIVE</span>
  <h2>Your LAT level is your <em>placement ticket.</em></h2>
  <p class="pa-lead">Every candidate gets a verified Level 1–5. Higher levels are surfaced first to hiring partners. Pick a level and watch your path change.</p>
  <div class="pa-levels" role="tablist" aria-label="Choose a level">${L.map((l, i) => `<button type="button" class="pa-lv" role="tab" style="--lc:${l.c}"><b>${i + 1}</b><span>${l.n}</span><small>${l.lbl}</small></button>`).join("")}</div>
  <a class="btn btn-ib-accent btn-lg" href="register.php"><span>Find my level</span><i class="bi bi-arrow-right"></i></a>
  <p class="pa-note">Opportunities depend on your assessed level, openings and hiring-partner requirements.</p></div>
  <div class="pa-stage"><div class="pa-card" aria-live="polite">
    <div class="pa-top"><span>CANDIDATE PROFILE</span><span>✓ LAT VERIFIED</span></div>
    <div class="pa-radar"><div class="pa-sweep"></div>${pos.map(([x, y]) => `<span class="pa-blip" style="left:${x}%;top:${y}%"></span>`).join("")}<div class="pa-core"><div id="paNum">L1</div></div></div>
    <div class="pa-offer"><small>YOUR OUTCOME BAND</small><div class="pa-band" id="paBand"></div><div class="pa-name" id="paName"></div></div>
    <ol class="pa-pipe" id="paPipe"><li></li><li></li><li></li><li></li></ol>
    <div class="pa-vis"><span>VISIBILITY PRIORITY</span><div><i></i><i></i><i></i><i></i><i></i></div></div>
  </div></div></div>`;
  how.before(sec);

  const q = (s) => sec.querySelector(s), btns = [...sec.querySelectorAll(".pa-lv")], blips = [...sec.querySelectorAll(".pa-blip")];
  const pipe = q("#paPipe"), lis = [...pipe.children], segs = [...sec.querySelectorAll(".pa-vis i")], card = q(".pa-card");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let cur = -1, timers = [], auto = null, seen = false;

  const scramble = (el, text) => {
    if (reduce) { el.textContent = text; return; }
    let f = 0; const ch = "0123456789+–LPAT";
    const t = setInterval(() => {
      el.textContent = text.split("").map((c, i) => (c === " " || i < f / 1.6 ? c : ch[Math.random() * ch.length | 0])).join("");
      if (++f > text.length * 1.6) { clearInterval(t); el.textContent = text; }
    }, 38);
  };
  const confetti = () => {
    if (reduce) return;
    for (let i = 0; i < 26; i++) {
      const p = document.createElement("i"); p.className = "pa-conf";
      p.style.cssText = `background:${["#ffb15c", "#8fb0ff", "#fff", "#c79bff"][i % 4]};--dx:${(Math.random() - .5) * 420}px;--dy:${-140 + Math.random() * 360}px;--r:${Math.random() * 720}deg`;
      card.appendChild(p); setTimeout(() => p.remove(), 1400);
    }
  };
  const go = (i, burst = true) => {
    if (i === cur) return; cur = i; const l = L[i];
    sec.style.setProperty("--c", l.c);
    btns.forEach((b, k) => { b.classList.toggle("on", k === i); b.setAttribute("aria-selected", k === i); });
    q("#paNum").textContent = "L" + (i + 1);
    scramble(q("#paBand"), l.b); q("#paName").textContent = l.n + " · " + l.d;
    blips.forEach((b, k) => b.classList.toggle("on", k < l.v + 1));
    segs.forEach((s, k) => s.classList.remove("on"));
    segs.forEach((s, k) => timers.push(setTimeout(() => s.classList.toggle("on", k < l.v), 120 * k)));
    timers.forEach(clearTimeout); timers = [];
    lis.forEach((li, k) => { li.textContent = l.s[k]; li.classList.remove("on"); });
    pipe.style.setProperty("--k", 0);
    lis.forEach((li, k) => timers.push(setTimeout(() => { li.classList.add("on"); pipe.style.setProperty("--k", k / 3); }, 350 + k * 380)));
    segs.forEach((s, k) => timers.push(setTimeout(() => s.classList.toggle("on", k < l.v), 120 * k)));
    if (i === 0 && burst && seen) confetti();
  };
  const start = () => { stop(); auto = setInterval(() => go((cur + 1) % 5), 4600); };
  const stop = () => { clearInterval(auto); auto = null; };
  btns.forEach((b, i) => b.addEventListener("click", () => { stop(); go(i); }));
  go(0, false);

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { if (!seen) { seen = true; confetti(); } if (!reduce && !auto) start(); } else stop();
    }), { threshold: 0.35 }).observe(sec);
  }
  sec.addEventListener("pointerenter", stop);
  sec.addEventListener("pointerleave", () => { if (!reduce) start(); });

  /* 3D tilt on the stage card */
  if (matchMedia("(hover:hover) and (pointer:fine)").matches && !reduce) {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--ry", ((e.clientX - r.left) / r.width - .5) * 12 + "deg");
      card.style.setProperty("--rx", (-((e.clientY - r.top) / r.height - .5)) * 12 + "deg");
    });
    card.addEventListener("pointerleave", () => { card.style.setProperty("--rx", "0deg"); card.style.setProperty("--ry", "0deg"); });
  }
})();
