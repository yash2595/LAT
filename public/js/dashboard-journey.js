(() => {
  "use strict";

  const icons = {
    payment: "credit-card",
    enrollment: "clipboard-check",
    batch: "calendar-days",
    exam: "file-pen-line",
    result: "chart-no-axes-combined",
    certificate: "award",
    placement: "briefcase-business"
  };
  const steps = Object.keys(icons);
  const completeWords = {
    payment: ["paid", "success", "completed", "complete"],
    enrollment: ["enrolled", "completed", "complete"],
    batch: ["assigned", "booked", "scheduled", "slot selected", "completed", "complete"],
    exam: ["passed", "completed", "complete"],
    result: ["available", "published", "completed", "complete"],
    certificate: ["issued", "completed", "complete"],
    placement: ["placed"]
  };
  const normalize = (value) => (value || "").trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
  const isSkipped = (value) => /^(not applicable|n\/a|waived|skipped)$/.test(normalize(value));
  const isDone = (step, value) => {
    const text = normalize(value);
    return Boolean(text && text !== "—" && !isSkipped(text) && completeWords[step].includes(text));
  };
  const route = document.getElementById("route");
  if (!route) return;

  const setIcon = (key, state) => {
    const circle = document.querySelector('[data-step="' + key + '"]');
    if (!circle) return;
    const icon = state === "locked" || state === "unavailable"
      ? "lock"
      : state === "skipped" ? "minus" : icons[key];
    circle.innerHTML = '<i data-lucide="' + icon + '" class="w-5 h-5"></i>';
  };

  const setPhase = (key, state) => {
    const phase = document.querySelector('[data-step-phase="' + key + '"]');
    if (!phase) return;
    const labels = {
      done: "Completed",
      current: "Up next",
      locked: "Locked",
      skipped: "Not applicable",
      loading: "Loading",
      unavailable: "Sign in to view",
      error: "Try again"
    };
    phase.textContent = labels[state] || "—";
  };

  const refreshIcons = () => {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
      window.lucide.createIcons();
    }
  };

  function update() {
    const authState = document.body.dataset.authState || "loading";
    const values = steps.map((key) => {
      const item = document.querySelector('[data-journey="' + key + '"]');
      return (item?.textContent || "").trim();
    });

    const next = document.getElementById("journey-next-step");
    const summary = document.getElementById("journey-summary-copy");
    const count = document.getElementById("journey-done-count");
    const meter = document.getElementById("journey-overview-meter");
    const fill = document.getElementById("journey-overview-fill");
    const login = document.getElementById("journey-login-link");
    const live = document.getElementById("journey-live-label");

    if (authState !== "ready") {
      const state = authState === "unauthenticated" ? "unavailable"
        : authState === "error" ? "error" : "loading";
      route.dataset.progressState = state;
      route.setAttribute("aria-busy", String(state === "loading"));
      route.style.setProperty("--p", "0");
      if (next) next.textContent = state === "unavailable" ? "Your progress is ready when you sign in"
        : state === "error" ? "Progress could not load" : "Loading your milestones…";
      if (summary) summary.textContent = state === "unavailable"
        ? "Sign in to see completed milestones and your next step."
        : state === "error" ? "Refresh the page to try loading your account progress again."
        : "Your account progress will appear here in a moment.";
      if (count) count.textContent = "— / " + steps.length;
      if (meter) {
        meter.setAttribute("aria-valuenow", "0");
        meter.setAttribute("aria-valuetext", state === "unavailable" ? "Sign in to load progress" : state === "error" ? "Progress could not load" : "Loading progress");
      }
      if (fill) fill.style.width = "0%";
      if (login) login.hidden = state !== "unavailable";
      if (live) {
        live.textContent = state === "unavailable" ? "Sign-in needed"
          : state === "error" ? "Connection issue" : "Syncing progress";
        live.dataset.state = state;
      }
      steps.forEach((key) => {
        const node = document.querySelector('[data-progress-step="' + key + '"]');
        if (node) {
          node.dataset.state = state;
          node.removeAttribute("aria-current");
        }
        setPhase(key, state);
        setIcon(key, state);
      });
      refreshIcons();
      return;
    }

    route.dataset.progressState = "ready";
    route.setAttribute("aria-busy", "false");
    const done = values.map((value, index) => isDone(steps[index], value));
    const skipped = values.map(isSkipped);
    let current = steps.findIndex((key, index) => !done[index] && !skipped[index]);
    if (current < 0) current = steps.length;

    steps.forEach((key, index) => {
      const node = document.querySelector('[data-progress-step="' + key + '"]');
      if (!node) return;
      const statusNode = document.querySelector('[data-journey="' + key + '"]');
      const statusValue = normalize(statusNode?.textContent);
      const batchNode = node.querySelector("[data-batch]");
      node.dataset.hasStatus = String(Boolean(statusValue && statusValue !== "—"));
      node.dataset.hasBatch = String(Boolean(batchNode && normalize(batchNode.textContent) && normalize(batchNode.textContent) !== "—"));
      const state = skipped[index] ? "skipped"
        : done[index] ? "done"
        : index === current ? "current" : "locked";
      node.dataset.state = state;
      if (state === "current") node.setAttribute("aria-current", "step");
      else node.removeAttribute("aria-current");
      setPhase(key, state);
      setIcon(key, state);
    });

    const doneCount = done.filter(Boolean).length;
    const resolvedCount = doneCount + skipped.filter(Boolean).length;
    const progress = current === steps.length ? 1 : current / (steps.length - 1);
    route.style.setProperty("--p", String(progress));

    const nextLabel = current < steps.length
      ? document.querySelector('[data-progress-step="' + steps[current] + '"] .lbl')?.textContent.trim()
      : "All milestones complete";
    if (next) next.textContent = nextLabel;
    if (summary) {
      summary.textContent = current < steps.length
        ? doneCount + " of " + steps.length + " milestones complete · " + nextLabel + " is up next."
        : doneCount + " of " + steps.length + " milestones complete. You have reached the end of this path.";
    }
    if (count) count.textContent = doneCount + " / " + steps.length;
    if (meter) {
      meter.setAttribute("aria-valuenow", String(resolvedCount));
      meter.setAttribute("aria-valuetext", resolvedCount + " of " + steps.length + " milestones resolved");
    }
    if (fill) fill.style.width = ((resolvedCount / steps.length) * 100) + "%";
    if (login) login.hidden = true;
    if (live) {
      live.textContent = "Live from your account";
      live.dataset.state = "ready";
    }
    refreshIcons();
  }

  let queued = false;
  const queueUpdate = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };

  document.addEventListener("DOMContentLoaded", update);
  document.addEventListener("student:journey-refresh", queueUpdate);
})();