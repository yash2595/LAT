(() => {
  "use strict";
  const hero = document.querySelector(".student-welcome");
  const journey = document.querySelector(".journey-panel");
  if (!hero || !journey) return;

  const store = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const h = now.getHours();

  // 1) Time-aware greeting -> Switched to a professional static greeting
  const greet = "Welcome back,";
  const line = hero.querySelector(".welcome-line");
  if (line) line.textContent = greet;

  // 2) Date chip (no streak)
  const chips = document.createElement("div");
  chips.className = "x-chips";
  const date = now.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
  chips.innerHTML = '<span class="x-chip">📅 ' + date + '</span>';
  hero.querySelector(".hero-actions")?.before(chips);

  // 3) Exam-day readiness checklist + daily tip
  const items = [
    ["id", "Government photo ID ready"],
    ["net", "Stable internet / charged device"],
    ["cam", "Webcam & mic permission allowed"],
    ["room", "Quiet room, no one else on screen"],
    ["tabs", "Other tabs & apps closed (violations get logged)"]
  ];
  const tips = [
    "Read every question fully before choosing. Rushed reading loses more marks than weak concepts.",
    "Skip and flag tough questions first. Come back with the time you saved.",
    "Do one 20-minute timed practice set today. Speed is a skill too.",
    "Sleep well the night before. A rested brain beats last-minute revision.",
    "Watch the timer every 10 questions, not every question.",
    "Eliminate two wrong options first. Your odds jump immediately."
  ];
  const tip = tips[Math.floor(now / 864e5) % tips.length];
  const done = store.get("ib_checklist", {});
  const sec = document.createElement("section");
  sec.className = "x-grid";
  sec.innerHTML =
    '<div class="x-card"><h3>Exam-day readiness</h3><p class="sub">Tick these off before you start your assessment.</p>' +
    items.map(([id, t]) => '<button type="button" class="x-check" role="checkbox" data-id="' + id + '" aria-checked="' + !!done[id] + '"><span class="box">✓</span><span class="lbl">' + t + "</span></button>").join("") +
    '<div class="x-meter"><i></i></div><p class="sub" id="x-count" style="margin:8px 0 0"></p></div>' +
    '<div class="x-card x-tip"><span class="x-tag">TIP OF THE DAY</span><p class="q">' + tip + '</p>' +
    '<div class="x-rules"><b>Exam rules, quick recap</b><ul><li>Stay on the exam tab until you submit</li><li>Keep your face visible to the camera</li><li>Answers auto-save, but submit before time ends</li></ul></div></div>';
  journey.after(sec);

  const paint = () => {
    const n = sec.querySelectorAll('[aria-checked="true"]').length;
    sec.querySelector(".x-meter i").style.width = (n / items.length) * 100 + "%";
    sec.querySelector("#x-count").textContent = n === items.length ? "All set. Best of luck! 🎯" : n + " of " + items.length + " ready";
  };
  sec.addEventListener("click", (e) => {
    const b = e.target.closest(".x-check");
    if (!b) return;
    const on = b.getAttribute("aria-checked") !== "true";
    b.setAttribute("aria-checked", on);
    done[b.dataset.id] = on;
    store.set("ib_checklist", done);
    paint();
  });
  paint();
})();
