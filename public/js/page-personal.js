(() => {
  "use strict";
  const body = document.body;
  if (!body || body.dataset.dashboard !== "student") return;
  const cur = location.pathname.split("/").pop() || "dashboard.html";
  document.querySelectorAll("aside nav a[href], aside a[data-page]").forEach((a) => {
    if (a.getAttribute("href") === "profile.html" && !a.closest("nav") && !a.dataset.page) return;
    const on = (a.getAttribute("href") || "").split("?")[0] === cur;
    a.className = "nl" + (on ? " act" : "");
    a.querySelectorAll("i,svg").forEach((i) => i.classList.add("w-5", "h-5", "shrink-0"));
    const dot = a.querySelector("span.ml-auto");
    if (!on && dot) dot.remove();
    if (on && !dot) a.insertAdjacentHTML("beforeend", '<span class="ml-auto w-2 h-2 rounded-full shrink-0" style="background:#fff"></span>');
  });
  const hero = document.querySelector('main section[class*="bg-gradient"][class*="text-white"]');
  if (!hero) return;
  const lines = {
    profile: "👤 Keep your details accurate and up to date",
    payments: "🔒 Complete payments only inside this portal",
    enrollment: "📝 Your enrollment details, all in one place",
    schedule: "🗓️ Your exam schedule at a glance",
    assessment: "🎯 Calm mind, clear answers",
    results: "📈 Every attempt is progress",
    certificate: "🏅 Proof of your hard work",
    placement: "💼 Your next opportunity starts here"
  };
  const line = lines[body.dataset.dashboardPage];
  if (!line) return;
  const date = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" });
  const wrap = document.createElement("div");
  wrap.className = "xp-chips";
  wrap.innerHTML = '<span class="xp-chip hot"></span><span class="xp-chip">📅 ' + date + "</span>";
  wrap.firstChild.textContent = line;
  const host = hero.querySelector("h1,h2")?.parentElement || hero;
  host.appendChild(wrap);
})();
