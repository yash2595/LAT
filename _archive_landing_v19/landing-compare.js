/* With LAT vs Without LAT showcase */
(() => {
  const how = document.querySelector("#how");
  if (!how) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const chipL = [["eye-slash-fill", "PROFILE HIDDEN", 22], ["question-circle-fill", "LEVEL UNKNOWN", 46], ["hourglass-split", "WAITING FOR VISIBILITY", 70]];
  const chipR = [["patch-check-fill", "LAT PROFILE VERIFIED", 22], ["envelope-paper-heart-fill", "INTERVIEW INVITE", 40], ["briefcase-fill", "PLACEMENT OFFER", 58], ["stars", "5+ OPPORTUNITIES", 76]];
  const rows = [
    ["Skill proof", "Claims written on a resume", "A verified Level 1–5 result"],
    ["Employer visibility", "Easy to get lost in the pile", "Higher levels surfaced first to hiring partners"],
    ["Credential", "Nothing a recruiter can verify", "QR-verifiable digital certificate"],
    ["Placement", "Hope and wait", "Considered for 5+ placement opportunities"],
    ["Your next step", "Unclear direction", "A clear path matched to your level"]
  ];
  const sec = document.createElement("section");
  sec.className = "cmp"; sec.id = "compare";
  sec.innerHTML = `<div class="cmp-wrap">
  <div><div class="cmp-stage" id="cmpStage" role="group" aria-label="Drag to compare life without LAT and with LAT">
    <div class="cmp-layer cmp-l"><span class="cmp-tag">WITHOUT LAT</span><img class="cmp-img" src="assets/lat-candidate-before.png" alt="Candidate worried, skills unseen">${chipL.map(([i, t, y], k) => `<span class="cmp-chip" style="top:${y}%;animation-delay:-${k * 1.3}s"><i class="bi bi-${i}"></i>${t}</span>`).join("")}</div>
    <div class="cmp-layer cmp-r"><div class="cmp-glow"></div><span class="cmp-tag">WITH LAT ✦</span><img class="cmp-img" src="assets/lat-candidate-after.png" alt="Same candidate confident, level verified">${chipR.map(([i, t, y], k) => `<span class="cmp-chip" style="top:${y}%;animation-delay:-${k * 1.1}s"><i class="bi bi-${i}"></i>${t}</span>`).join("")}</div>
    <div class="cmp-div"><span class="cmp-knob" id="cmpKnob" role="slider" tabindex="0" aria-label="Comparison position" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50"><i class="bi bi-arrow-left-right"></i></span></div>
  </div>
  <div class="cmp-ctl" role="group"><button type="button" data-to="100">Without LAT</button><button type="button" class="on" data-to="50">Compare</button><button type="button" data-to="0">With LAT</button></div></div>
  <div><span class="cmp-kick">✦ WITHOUT LAT vs WITH LAT</span>
  <h2>Same candidate. <em>Two very different futures.</em></h2>
  <p class="cmp-lead">Drag the divider. Without an assessed level, your skills stay unseen. With LAT, they turn into a verified level that can lead to placement.</p>
  <div class="cmp-head"><span></span><span>✕ WITHOUT LAT</span><span>✓ WITH LAT</span></div>
  ${rows.map(([a, b, c]) => `<div class="cmp-row"><b>${a}</b><span class="cmp-no"><i class="bi bi-x-circle-fill"></i>${b}</span><span class="cmp-yes"><i class="bi bi-check-circle-fill"></i>${c}</span></div>`).join("")}
  <a class="btn btn-ib-primary btn-lg cmp-cta" href="register.php"><span>Get my LAT level</span><i class="bi bi-arrow-right"></i></a></div></div>`;
  how.before(sec);

  const stage = sec.querySelector("#cmpStage"), knob = sec.querySelector("#cmpKnob"), btns = [...sec.querySelectorAll(".cmp-ctl button")];
  let p = 50, raf = 0, user = false;
  const set = (v) => {
    p = Math.max(0, Math.min(100, v)); stage.style.setProperty("--p", p); knob.setAttribute("aria-valuenow", Math.round(p));
    btns.forEach((b) => b.classList.toggle("on", Math.abs(+b.dataset.to - p) < 6));
  };
  const tween = (to, ms = 900, done) => {
    cancelAnimationFrame(raf); const from = p, t0 = performance.now();
    const step = (t) => { const k = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - k, 3); set(from + (to - from) * e); if (k < 1) raf = requestAnimationFrame(step); else done && done(); };
    reduce ? set(to) : (raf = requestAnimationFrame(step));
  };
  const fromX = (x) => { const r = stage.getBoundingClientRect(); set(((x - r.left) / r.width) * 100); };
  let drag = false;
  stage.addEventListener("pointerdown", (e) => { drag = user = true; cancelAnimationFrame(raf); stage.setPointerCapture(e.pointerId); fromX(e.clientX); });
  stage.addEventListener("pointermove", (e) => { if (drag) fromX(e.clientX); });
  stage.addEventListener("pointerup", () => (drag = false));
  knob.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") { user = true; set(p - 5); } if (e.key === "ArrowRight") { user = true; set(p + 5); } });
  btns.forEach((b) => b.addEventListener("click", () => { user = true; tween(+b.dataset.to, 800); }));

  /* journey cards in the hero jump here */
  [["compare-before", 100], ["compare-after", 0]].forEach(([c, to]) => {
    const el = document.querySelector("." + c); if (!el) return;
    el.setAttribute("role", "button"); el.tabIndex = 0;
    const go = () => { sec.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); setTimeout(() => { user = true; tween(to, 900); }, 700); };
    el.addEventListener("click", go); el.addEventListener("keydown", (e) => e.key === "Enter" && go());
  });

  if ("IntersectionObserver" in window) {
    new IntersectionObserver((es, o) => es.forEach((e) => {
      if (!e.isIntersecting) return; o.disconnect();
      sec.querySelectorAll(".cmp-row").forEach((r, i) => setTimeout(() => r.classList.add("on"), 250 + i * 140));
      if (!user && !reduce) tween(88, 1100, () => !user && tween(12, 1700, () => !user && tween(50, 1000)));
    }), { threshold: 0.4 }).observe(sec);
  } else sec.querySelectorAll(".cmp-row").forEach((r) => r.classList.add("on"));
})();
