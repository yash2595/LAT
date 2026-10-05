(() => {
  "use strict";

  const API = "/api/admin/evaluate.php";
  let csrfToken = null;

  async function getCsrfToken() {
    if (csrfToken) return csrfToken;
    const response = await fetch(`${API}?action=csrf`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
    });
    const payload = await response.json();
    if (!response.ok || payload.status === "error") {
      if (response.status === 401 || (response.status === 403 && payload?.data?.reason !== "admin_only")) {
        window.location.href = "/login.php";
        return;
      }
      throw new Error(payload.message || "Security token could not be loaded.");
    }
    csrfToken = payload.data?.token || null;
    if (!csrfToken) throw new Error("Security token could not be loaded.");
    return csrfToken;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) =>
    Array.from(root.querySelectorAll(selector));

  const escapeHtml = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const formatDate = (value) => {
    if (!value) return "—";
    const d = new Date(String(value).replace(" ", "T"));
    if (Number.isNaN(d.getTime())) return escapeHtml(value);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const label = (value) => {
    const map = {
      issued: "Issued",
      "not-issued": "Not Issued",
      "not-started": "Not Started",
      not_started: "Not Started",
      in_progress: "In Progress",
      submitted: "Submitted",
      evaluated: "Evaluated",
      expired: "Expired",
      pending: "Pending",
      success: "Paid",
      failed: "Failed",
      eligible: "Placement Ready",
      shortlisted: "Shortlisted",
      interviewing: "Interview",
      placed: "Placed",
      not_placed: "Not Placed",
      approved: "Approved",
      rejected: "Rejected",
    };
    return (
      map[value] ||
      String(value || "—")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
    );
  };

  const normalizeFilterValue = (value) => {
    const v = String(value ?? "").trim().toLowerCase().replace(/_/g, "-");
    const aliases = {
      paid: "success",
      enrolled: "eligible",
      "in-progress": "in_progress",
      "not-started": "not_started",
      "placement-ready": "eligible",
      interview: "interviewing",
      generated: "verified",
      completed: "evaluated",
    };
    return aliases[v] ?? v;
  };

  const sameFilterValue = (actual, selected) => {
    const a = normalizeFilterValue(actual);
    const s = normalizeFilterValue(selected);
    if (!s) return true;
    if (s === "pending") return a === "pending";
    if (s === "not-started") return a === "not-started" || a === "not_started";
    if (s === "completed") return a === "completed" || a === "evaluated";
    if (s === "issued") return a === "issued" || a === "verified";
    return a === s;
  };

  const refreshIcons = () => {
    if (typeof lucide !== "undefined" && typeof lucide.createIcons === "function") {
      lucide.createIcons();
    }
  };

  const badge = (text, type = "slate") => {
    const styles = {
      green: "bg-green-50 text-green-600",
      blue: "bg-blue-50 text-blue-600",
      amber: "bg-amber-50 text-amber-600",
      red: "bg-red-50 text-red-600",
      purple: "bg-purple-50 text-purple-700 border border-purple-200",
      slate: "bg-slate-100 text-slate-600",
    };
    return `<span class="inline-flex rounded-full px-3 py-1 text-xs font-medium ${styles[type] || styles.slate}">${escapeHtml(text)}</span>`;
  };

  const typeForStatus = (value) => {
    if (
      ["success", "completed", "evaluated", "approved", "placed", "verified", "issued"].includes(value)
    )
      return "green";
    if (["eligible", "shortlisted", "interviewing", "pending", "submitted", "not-issued"].includes(value))
      return "amber";
    if (["failed", "rejected", "not_placed", "expired"].includes(value))
      return "red";
    if (["not_started", "not-started"].includes(value))
      return "slate";
    return "blue";
  };

  
  async function apiQbank(action, options = {}) {
    const url = `/api/qbank/${action}.php`;
    const config = {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      ...options,
    };
    config.headers = { Accept: "application/json", ...(options.headers || {}) };
    if ((config.method || "GET").toUpperCase() === "POST") {
      config.headers["X-CSRF-Token"] = await getCsrfToken();
    }
    if (config.body && typeof config.body !== "string" && !(config.body instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
      config.body = JSON.stringify(config.body);
    }
    const response = await fetch(url, config);
    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(text || `Request failed (${response.status})`);
    }
    if (!response.ok || payload.status === "error") {
      if (response.status === 401 || (response.status === 403 && payload?.data?.reason !== "admin_only")) {
        window.location.href = "/login.php";
        return;
      }
      throw new Error(payload.message || `Request failed (${response.status})`);
    }
    return payload.data;
  }

  async function api(action, options = {}) {
    const url = `${API}?action=${encodeURIComponent(action)}`;
    const config = {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      ...options,
    };
    config.headers = { Accept: "application/json", ...(options.headers || {}) };
    if ((config.method || "GET").toUpperCase() === "POST") {
      config.headers["X-CSRF-Token"] = await getCsrfToken();
    }
    if (config.body && typeof config.body !== "string" && !(config.body instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
      config.body = JSON.stringify(config.body);
    }
    const response = await fetch(url, config);
    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch {
      throw new Error(text || `Request failed (${response.status})`);
    }
    if (!response.ok || payload.status === "error") {
      if (response.status === 401 || (response.status === 403 && payload?.data?.reason !== "admin_only")) {
        window.location.href = "/login.php";
        return;
      }
      throw new Error(payload.message || `Request failed (${response.status})`);
    }
    return payload.data;
  }

  function notify(message, isError = false) {
    let box = $("#m7Toast");
    if (!box) {
      box = document.createElement("div");
      box.id = "m7Toast";
      box.className =
        "fixed right-5 top-5 z-[100] max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition";
      document.body.appendChild(box);
    }
    box.textContent = message;
    box.className = `fixed right-5 top-5 z-[100] max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-lg transition ${isError ? "bg-red-600 text-white" : "bg-slate-900 text-white"}`;
    clearTimeout(box._timer);
    box._timer = setTimeout(() => box.remove(), 3200);
  }

  function modal(title, html) {
    let root = $("#m7Modal");
    if (root) root.remove();
    root = document.createElement("div");
    root.id = "m7Modal";
    root.className =
      "fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/50 p-4";
    root.innerHTML = `
      <div class="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-2xl bg-white shadow-2xl">
        <div class="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h3 class="text-lg font-semibold text-slate-900">${escapeHtml(title)}</h3>
          <button type="button" id="m7ModalClose" class="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close">✕</button>
        </div>
        <div class="p-6">${html}</div>
      </div>`;
    document.body.appendChild(root);
    $("#m7ModalClose", root).onclick = () => root.remove();
    root.addEventListener("click", (e) => {
      if (e.target === root) root.remove();
    });
    return root;
  }

  async function loadAdminIdentity() {
    try {
      const data = await api("settings");
      const profile = data.profile || {};
      const name = profile.full_name || "Admin";
      const email = profile.email || "";
      const initial = name.trim().charAt(0).toUpperCase() || "A";

      $$("#adminHeaderName").forEach((el) => (el.textContent = name));
      $$("#adminAvatarInitial").forEach((el) => (el.textContent = initial));
      $$("#settingsAvatarInitial").forEach((el) => (el.textContent = initial));

      const avatar = profile.avatar_url || data.avatar_url || "";
      if (avatar) {
        $$("#adminAvatarImage, #settingsAvatarImage").forEach((img) => {
          img.src = `${avatar}${avatar.includes("?") ? "&" : "?"}v=${Date.now()}`;
          img.classList.remove("hidden");
        });
        $$("#adminAvatarInitial, #settingsAvatarInitial").forEach((el) => el.classList.add("hidden"));
      }

      $$("#adminAvatar, #changePhotoButton").forEach((el) => {
        if (el.dataset.avatarBound) return;
        el.dataset.avatarBound = "1";
        el.addEventListener("click", (e) => {
          if (el.id === "changePhotoButton") {
            e.preventDefault();
            $("#avatarUpload")?.click();
          }
        });
      });

      const upload = $("#avatarUpload");
      if (upload && !upload.dataset.bound) {
        upload.dataset.bound = "1";
        upload.addEventListener("change", async () => {
          const file = upload.files?.[0];
          if (!file) return;
          if (!/^image\/(png|jpe?g|webp)$/.test(file.type) || file.size > 2 * 1024 * 1024) {
            notify("Choose a PNG, JPG or WEBP image up to 2 MB.", true);
            upload.value = "";
            return;
          }

          const previewUrl = URL.createObjectURL(file);
          $$("#adminAvatarImage, #settingsAvatarImage").forEach((img) => {
            img.src = previewUrl;
            img.classList.remove("hidden");
          });
          $$("#adminAvatarInitial, #settingsAvatarInitial").forEach((el) => el.classList.add("hidden"));

          try {
            const form = new FormData();
            form.append("avatar", file);
            const result = await api("avatar-upload", { method: "POST", body: form });
            const saved = result?.avatar_url || "";
            if (saved) {
              $$("#adminAvatarImage, #settingsAvatarImage").forEach((img) => {
                img.src = `${saved}${saved.includes("?") ? "&" : "?"}v=${Date.now()}`;
              });
            }
            notify("Profile photo updated successfully.");
          } catch (e) {
            notify(e.message || "Profile photo upload failed.", true);
            if (avatar) {
              $$("#adminAvatarImage, #settingsAvatarImage").forEach((img) => (img.src = avatar));
            }
          } finally {
            URL.revokeObjectURL(previewUrl);
            upload.value = "";
          }
        });
      }
      void email;
    } catch (e) {
      console.warn("Admin identity could not be loaded:", e.message);
    }
  }

  function initResponsiveShell() {
    const sidebar = $("#sidebar") || document.querySelector("aside");
    if (!sidebar || document.getElementById("m7MobileMenuButton")) return;
    if ($("#menuButton") && $("#sidebarOverlay")) return;

    const button = document.createElement("button");
    button.id = "m7MobileMenuButton";
    button.type = "button";
    button.className = "items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm";
    button.setAttribute("aria-label", "Open navigation");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", sidebar.id || "sidebar");
    if (!sidebar.id) sidebar.id = "sidebar";
    button.innerHTML = '<i data-lucide="menu" class="h-5 w-5"></i>';

    const overlay = document.createElement("button");
    overlay.id = "m7MobileOverlay";
    overlay.type = "button";
    overlay.className = "fixed inset-0 z-30 hidden bg-slate-900/40";
    overlay.setAttribute("aria-label", "Close navigation");
    document.body.appendChild(overlay);

    const header = document.querySelector("body > div.flex-1.flex.flex-col > header");
    if (header) header.insertBefore(button, header.firstElementChild);

    const close = () => {
      sidebar.classList.remove("m7-open");
      overlay.classList.remove("m7-visible");
      document.body.classList.remove("admin-mobile-menu-open");
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-label", "Open navigation");
    };
    button.addEventListener("click", () => {
      const isOpen = sidebar.classList.toggle("m7-open");
      overlay.classList.toggle("m7-visible", isOpen);
      document.body.classList.toggle("admin-mobile-menu-open", isOpen);
      button.setAttribute("aria-expanded", String(isOpen));
      button.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
    });
    overlay.addEventListener("click", close);
    sidebar.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
    window.addEventListener("resize", () => {
      if (window.innerWidth >= 1024) close();
    });
    refreshIcons();
  }

  async function logoutAdmin() {
    try {
      const csrf = await getCsrfToken();
      await fetch("/api/auth/logout.php", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "X-CSRF-Token": csrf,
        },
        body: JSON.stringify({ csrf_token: csrf }),
      });
      sessionStorage.clear();
      window.location.href = "../login.php";
    } catch {
      sessionStorage.clear();
      window.location.href = "../login.php";
    }
  }


  function initCommon() {
    initResponsiveShell();
    const currentPage = window.location.pathname.split("/").pop();
    $$("aside nav a").forEach((item) => {
      const link = item.getAttribute("href");
      item.classList.remove("bg-intern-blue", "font-medium", "text-white");
      item.classList.add("text-slate-600");
      if (link === currentPage) {
        item.classList.remove("text-slate-600");
        item.classList.add("bg-intern-blue", "font-medium", "text-white");
      }
    });

    const currentDate = $("#currentDate");
    if (currentDate)
      currentDate.textContent = new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

    const menuButton = $("#menuButton");
    const sidebar = $("#sidebar");
    const overlay = $("#sidebarOverlay");
    if (menuButton && sidebar) {
      menuButton.setAttribute("aria-controls", sidebar.id || "sidebar");
      menuButton.setAttribute("aria-label", "Open navigation");
      menuButton.setAttribute("aria-expanded", "false");
      const closeMenu = () => {
        sidebar.classList.remove("m7-open");
        sidebar.classList.add("-translate-x-full");
        overlay?.classList.add("hidden");
        document.body.classList.remove("admin-mobile-menu-open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation");
      };
      menuButton.addEventListener("click", () => {
        const isOpen = !sidebar.classList.contains("m7-open");
        sidebar.classList.toggle("m7-open", isOpen);
        sidebar.classList.toggle("-translate-x-full", !isOpen);
        overlay?.classList.toggle("hidden", !isOpen);
        document.body.classList.toggle("admin-mobile-menu-open", isOpen);
        menuButton.setAttribute("aria-expanded", String(isOpen));
        menuButton.setAttribute("aria-label", isOpen ? "Close navigation" : "Open navigation");
      });
      overlay?.addEventListener("click", closeMenu);
      sidebar.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
          closeMenu();
          menuButton.focus();
        }
      });
      window.addEventListener("resize", () => {
        if (window.innerWidth >= 1024) closeMenu();
      });
    }

    const userButton = $("#userButton"),
      userDropdown = $("#userDropdown");
    if (userButton && userDropdown) {
      userButton.addEventListener("click", (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle("hidden");
      });
      document.addEventListener("click", () =>
        userDropdown.classList.add("hidden"),
      );
    }

    const notificationButton = $("#notificationButton"),
      notificationDropdown = $("#notificationDropdown");
    if (notificationButton && notificationDropdown) {
      notificationButton.addEventListener("click", (e) => {
        e.stopPropagation();
        notificationDropdown.classList.toggle("hidden");
      });
      document.addEventListener("click", () =>
        notificationDropdown.classList.add("hidden"),
      );
    }

    $$("a[href='#']").forEach((link) => {
      if (
        link.textContent.trim().toLowerCase() === "logout" &&
        !link.dataset.logoutBound
      ) {
        link.dataset.logoutBound = "1";
        link.addEventListener("click", (e) => {
          e.preventDefault();
          void logoutAdmin();
        });
      }
    });
    void loadAdminIdentity();
    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  async function loadDashboard() {
    const data = await api("dashboard");
    const set = (id, value) => {
      const el = $(`#${id}`);
      if (el) el.textContent = value ?? 0;
    };

    set("totalRegistrations", data.total_registrations);
    set("paidCandidates", data.paid_candidates);
    set("eligibleCandidates", data.eligible_candidates);
    set("upcomingBatches", data.upcoming_batches);
    set("availableSlots", data.available_slots);
    set("completedAssessments", data.completed_assessments);
    set("certificates", data.certificates);
    set("completedAssessmentCount", data.completed_assessments);
    set("pendingAssessmentCount", data.eligible_candidates || 0);

    const totalAssessments =
      (data.completed_assessments || 0) + (data.eligible_candidates || 0);
    const completedPct = totalAssessments
      ? Math.round((data.completed_assessments / totalAssessments) * 100)
      : 0;
    const completedBar = $("#completedAssessmentBar");
    const pendingBar = $("#pendingAssessmentBar");
    if (completedBar) completedBar.style.width = `${completedPct}%`;
    if (pendingBar) pendingBar.style.width = `${100 - completedPct}%`;

    for (let i = 1; i <= 5; i++) {
      const count = Number(
        data.level_counts?.[String(i)] || data.level_counts?.[i] || 0,
      );
      set(`level${i}Count`, count);
      const bar = $(`#level${i}Bar`);
      if (bar) {
        const total = Object.values(data.level_counts || {}).reduce(
          (a, b) => a + Number(b),
          0,
        );
        bar.style.width = `${total ? Math.round((count / total) * 100) : 0}%`;
      }
    }

    // Run integrity check in background with 5-min cache
    setTimeout(async () => {
      try {
        const now = Date.now();
        const cached = sessionStorage.getItem("integrityCheck");
        let desyncCount = 0;
        
        if (cached) {
          const parsed = JSON.parse(cached);
          if (now - parsed.time < 5 * 60 * 1000) {
            desyncCount = parsed.count;
          }
        }
        
        if (desyncCount === 0 && (!cached || now - JSON.parse(cached).time >= 5 * 60 * 1000)) {
          const checkData = await api("integrity_check");
          desyncCount = checkData.desync_count || 0;
          sessionStorage.setItem("integrityCheck", JSON.stringify({ time: now, count: desyncCount }));
        }

        const banner = $("#integrityWarningBanner");
        if (banner) {
          if (desyncCount > 0) {
            $("#integrityDesyncCount").textContent = desyncCount;
            banner.classList.remove("hidden");
          } else {
            banner.classList.add("hidden");
          }
        }
      } catch (e) {
        console.warn("Integrity check failed:", e);
      }
    }, 100);

    const recent = $("#recentCandidates");
    if (recent) {
      const candidates = data.recent_candidates || [];
      recent.innerHTML = candidates.length
        ? candidates
            .map(
              (c) => `
        <tr class="hover:bg-slate-50">
          <td class="px-6 py-4 font-medium">${escapeHtml(c.full_name)}</td>
          <td class="px-6 py-4 text-slate-500">${escapeHtml(c.email)}</td>
          <td class="px-6 py-4">${badge(label(c.payment_status), typeForStatus(c.payment_status === "success" ? "success" : c.payment_status))}</td>
          <td class="px-6 py-4">${badge(c.enrollment_status === "eligible" ? "Enrolled" : "Pending", c.enrollment_status === "eligible" ? "green" : "amber")}</td>
          <td class="px-6 py-4">${badge(label(c.assessment_status), typeForStatus(c.assessment_status === "completed" ? "completed" : c.assessment_status))}</td>
        </tr>`,
            )
            .join("")
        : `<tr><td class="px-6 py-8 text-center text-sm text-slate-500" colspan="5">No candidate data available</td></tr>`;

      const countBadge = $("#recentCandidatesCount");
      if (countBadge) countBadge.textContent = `Last ${candidates.length} candidates`;
    }

    const batches = $("#upcomingBatchesTable");
    if (batches) {
      batches.innerHTML = data.upcoming_batch_rows?.length
        ? data.upcoming_batch_rows
            .map(
              (b) => `
        <tr class="hover:bg-slate-50">
          <td class="px-6 py-4 font-medium">${escapeHtml(b.batch_number)}</td>
          <td class="px-6 py-4 text-slate-500">${formatDate(b.exam_date)}</td>
          <td class="px-6 py-4 text-slate-500">${b.exam_date ? new Date(`${b.exam_date}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long" }) : "—"}</td>
          <td class="px-6 py-4">${Number(b.candidate_count || 0)}</td>
          <td class="px-6 py-4">${Number(b.available_slots || 0)}</td>
          <td class="px-6 py-4">${badge(label(b.schedule_status), typeForStatus(b.schedule_status))}</td>
        </tr>`,
            )
            .join("")
        : `<tr><td class="px-6 py-8 text-center text-sm text-slate-500" colspan="6">No upcoming batches available</td></tr>`;
    }
    
    const alertsContainer = $("#batchAlertsContainer");
    if (alertsContainer) {
      if (data.pending_requests && data.pending_requests.length > 0) {
        alertsContainer.innerHTML = data.pending_requests.map(req => {
          return `
            <div class="flex items-center justify-between bg-amber-100 border-b border-amber-200 px-4 py-3 shadow-sm">
              <div class="flex items-center gap-3">
                <i data-lucide="alert-circle" class="w-5 h-5 text-amber-600"></i>
                <div>
                  <h4 class="font-semibold text-amber-900 text-sm">Action Required: Finalize Batch for ${escapeHtml(req.assessment_title)}</h4>
                  <p class="text-xs text-amber-700 mt-0.5">
                    Preferred Date: <strong>${formatDate(req.preferred_date)}</strong> &middot; Slot: <strong>${escapeHtml(req.preferred_time_slot)}</strong> &middot; Candidates Registered: <strong>${req.candidate_count}</strong>
                  </p>
                </div>
              </div>
              <button class="finalize-batch-btn shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 transition" 
                data-schedule-id="${req.schedule_id}" data-assessment-id="${req.assessment_id}">
                Finalize Batch
              </button>
            </div>
          `;
        }).join("");
        
        $$(".finalize-batch-btn").forEach(btn => {
          btn.onclick = async () => {
            if (!confirm("Are you sure you want to finalize this batch? This action cannot be undone.")) return;
            try {
              btn.disabled = true;
              btn.textContent = "Finalizing...";
              await api("finalize_batch", {
                method: "POST",
                body: { schedule_id: Number(btn.dataset.scheduleId), assessment_id: Number(btn.dataset.assessmentId) }
              });
              notify("Batch finalized successfully!");
              await loadDashboard();
            } catch (err) {
              notify(err.message, true);
              btn.disabled = false;
              btn.textContent = "Finalize Batch";
            }
          };
        });
      } else {
        alertsContainer.innerHTML = "";
      }
      if (typeof lucide !== 'undefined') lucide.createIcons();
    }
  }

  function bindAddCandidateButton() {
    const buttons = $$("button").filter((b) =>
      b.textContent.trim().toLowerCase().includes("add candidate"),
    );
    buttons.forEach((button) => {
      if (button.dataset.bound) return;
      button.dataset.bound = "1";
      button.addEventListener("click", () => {
        const root = modal(
          "Add Candidate",
          `<form id="addCandidateForm" class="space-y-4">
            <label class="block text-sm font-medium text-slate-700">Full Name
              <input id="newCandidateName" required maxlength="150" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" placeholder="Candidate name">
            </label>
            <label class="block text-sm font-medium text-slate-700">Email
              <input id="newCandidateEmail" required type="email" maxlength="255" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" placeholder="candidate@example.com">
            </label>
            <label class="block text-sm font-medium text-slate-700">Phone
              <input id="newCandidatePhone" required maxlength="20" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" placeholder="Phone number">
            </label>
            <button class="w-full rounded-lg bg-intern-blue px-4 py-2.5 text-sm font-medium text-white">Create Candidate</button>
          </form>`,
        );
        $("#addCandidateForm", root).onsubmit = async (e) => {
          e.preventDefault();
          try {
            const data = await api("candidate-create", {
              method: "POST",
              body: {
                full_name: $("#newCandidateName", root).value.trim(),
                email: $("#newCandidateEmail", root).value.trim(),
                phone: $("#newCandidatePhone", root).value.trim(),
              },
            });
            root.remove();
            notify(`Candidate created. Temporary password: ${data.temporary_password}`);
            await loadCandidates();
          } catch (err) {
            notify(err.message, true);
          }
        };
      });
    });
  }

  async function loadCandidates() {
    const data = await api("candidates");
    const tbody = $("#candidatesTableBody");
    if (!tbody) return;
    tbody.innerHTML = data.candidates.length
      ? data.candidates
          .map(
            (c) => `
      <tr class="hover:bg-slate-50" data-candidate="true" data-payment="${escapeHtml(c.payment_status)}" data-enrollment="${escapeHtml(c.enrollment_status)}" data-assessment="${escapeHtml(c.assessment_status)}" data-certificate="${escapeHtml(c.certificate_status)}">
        <td class="px-6 py-4 font-medium">${escapeHtml(c.full_name)}</td>
        <td class="px-6 py-4 text-slate-500">${escapeHtml(c.email)}</td>
        <td class="px-6 py-4">${badge(label(c.payment_status), typeForStatus(c.payment_status === "success" ? "success" : c.payment_status))}</td>
        <td class="px-6 py-4">${badge(c.enrollment_status === "eligible" ? "Enrolled" : "Pending", c.enrollment_status === "eligible" ? "green" : "amber")}</td>
        <td class="px-6 py-4">${badge(label(c.assessment_status), typeForStatus(c.assessment_status === "completed" ? "completed" : c.assessment_status))}</td>
        <td class="px-6 py-4">${c.level_assigned ? `Level ${escapeHtml(c.level_assigned)}` : "—"}</td>
        <td class="px-6 py-4">${badge(label(c.certificate_status), typeForStatus(c.certificate_status))}</td>
        <td class="px-6 py-4"><button class="font-medium text-intern-blue hover:underline view-candidate-btn" type="button" data-id="${c.id}">View</button></td>
      </tr>`,
          )
          .join("")
      : `<tr><td class="px-6 py-8 text-center text-sm text-slate-500" colspan="8">No candidates found</td></tr>`;

    $$(".view-candidate-btn").forEach((btn) =>
      btn.addEventListener("click", async () => {
        try {
          const response = await fetch(
            `${API}?action=candidate&id=${encodeURIComponent(btn.dataset.id)}`,
          );
          const payload = await response.json();
          if (payload.status === "error") throw new Error(payload.message);
          const c = payload.data;
          modal(
            "Candidate Details",
            `
          <div class="grid gap-4 sm:grid-cols-2 text-sm">
            <div><p class="text-slate-400">Name</p><p class="font-medium text-slate-900">${escapeHtml(c.full_name)}</p></div>
            <div><p class="text-slate-400">Email</p><p class="font-medium text-slate-900">${escapeHtml(c.email)}</p></div>
            <div><p class="text-slate-400">Phone</p><p class="font-medium text-slate-900">${escapeHtml(c.phone)}</p></div>
            <div><p class="text-slate-400">Payment</p><p>${badge(label(c.payment_status), typeForStatus(c.payment_status === "success" ? "success" : c.payment_status))}</p></div>
            <div><p class="text-slate-400">Enrollment</p><p>${badge(c.enrollment_status === "eligible" ? "Enrolled" : "Pending", c.enrollment_status === "eligible" ? "green" : "amber")}</p></div>
            <div><p class="text-slate-400">Assessment</p><p class="font-medium text-slate-900">${escapeHtml(c.assessment_title || "—")}</p></div>
          </div>`,
          );
        } catch (e) {
          notify(e.message, true);
        }
      }),
    );
    wireCandidateFilters();
  }

  function exportCandidatesCsv() {
    const rows = $$("#candidatesTableBody tr[data-candidate]").filter(row => row.style.display !== "none");
    if (rows.length === 0) {
      notify("No candidates to export");
      return;
    }

    const header = ["Name", "Email", "Payment", "Enrollment", "Assessment", "Level", "Certificate"];
    let csvContent = header.join(",") + "\r\n";

    rows.forEach(row => {
      const cells = [];
      for (let i = 0; i < 7; i++) {
        const text = row.children[i].textContent.trim();
        cells.push('"' + text.replace(/"/g, '""') + '"');
      }
      csvContent += cells.join(",") + "\r\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `candidates-export-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function wireCandidateFilters() {
    const search = $("#candidateSearch"),
      payment = $("#paymentFilter"),
      enrollment = $("#enrollmentFilter"),
      assessment = $("#assessmentFilter"),
      certificate = $("#certificateFilter"),
      count = $("#candidateCount");
    const run = () => {
      const q = (search?.value || "").toLowerCase().trim();
      const p = (payment?.value || "").toLowerCase();
      const en = (enrollment?.value || "").toLowerCase();
      const a = (assessment?.value || "").toLowerCase();
      const c = (certificate?.value || "").toLowerCase();
      let visible = 0;
      $$("#candidatesTableBody tr[data-candidate]").forEach((row) => {
        const ok =
          row.textContent.toLowerCase().includes(q) &&
          sameFilterValue(row.dataset.payment, p) &&
          sameFilterValue(row.dataset.enrollment, en) &&
          sameFilterValue(row.dataset.assessment, a) &&
          sameFilterValue(row.dataset.certificate, c);
        row.style.display = ok ? "" : "none";
        if (ok) visible++;
      });
      if (count)
        count.textContent = `${visible} Candidate${visible !== 1 ? "s" : ""}`;
    };
    [search, payment, enrollment, assessment, certificate].forEach((el) =>
      el?.addEventListener("input", run),
    );
    [payment, enrollment, assessment, certificate].forEach((el) =>
      el?.addEventListener("change", run),
    );
    const exportBtn = $("#exportCandidatesCsv");
    if (exportBtn && !exportBtn.dataset.bound) {
      exportBtn.dataset.bound = "1";
      exportBtn.addEventListener("click", exportCandidatesCsv);
    }
    run();
  }

  async function loadResults() {
    const [resultData, pendingData] = await Promise.all([
      api("results"),
      api("pending-attempts"),
    ]);
    const results = resultData.results || [];
    const pending = pendingData.attempts || [];
    const tbody = $("#resultsTableBody");
    const completed = $("#completedResults"),
      pendingEl = $("#pendingResults"),
      total = $("#totalResults"),
      average = $("#averageScore");
    if (total) total.textContent = results.length + pending.length;
    if (completed) completed.textContent = results.length;
    if (pendingEl) pendingEl.textContent = pending.length;
    if (average)
      average.textContent = results.length
        ? `${(results.reduce((s, r) => s + Number(r.percentage || 0), 0) / results.length).toFixed(1)}%`
        : "0%";

    if (!tbody) return;
    const rows = results.map(
      (r) => {
        const displayStatus = r.display_status || "evaluated";
        const rawStatus = r.attempt_status || r.status || "";
        const statusLabel = label(displayStatus);
        const rawHint = rawStatus && rawStatus !== displayStatus ? ` <span class="text-xs text-slate-400">(${escapeHtml(rawStatus)})</span>` : "";
        return `
      <tr data-result="true" data-level="level ${r.level_assigned}" data-status="${escapeHtml(displayStatus)}">
        <td class="px-6 py-4"><div><p class="font-medium text-slate-900">${escapeHtml(r.full_name)}</p><p class="text-xs text-slate-500">${escapeHtml(r.email)}</p></div></td>
        <td class="px-6 py-4"><span class="result-score font-semibold text-slate-900">${escapeHtml(r.percentage)}%</span></td>
        <td class="px-6 py-4">${badge(`Level ${r.level_assigned}`, "blue")}</td>
        <td class="px-6 py-4">${badge(statusLabel, typeForStatus(displayStatus))}${rawHint}</td>
        <td class="px-6 py-4 text-slate-500">${formatDate(r.created_at)}</td>
        <td class="px-6 py-4"><button class="view-result-btn inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-intern-blue hover:text-intern-blue" type="button" data-attempt="${r.attempt_id}">View</button></td>
      </tr>`;
      }
    );

    const pendingRows = pending.map(
      (a) => {
        const displayStatus = a.display_status || a.status;
        const rawStatus = a.status || "";
        const statusLabel = label(displayStatus);
        const rawHint = rawStatus && rawStatus !== displayStatus ? ` <span class="text-xs text-slate-400">(${escapeHtml(rawStatus)})</span>` : "";
        return `
      <tr data-result="true" data-level="" data-status="${escapeHtml(displayStatus)}">
        <td class="px-6 py-4"><div><p class="font-medium text-slate-900">${escapeHtml(a.full_name)}</p><p class="text-xs text-slate-500">${escapeHtml(a.email)}</p></div></td>
        <td class="px-6 py-4 font-semibold text-slate-500">Pending</td>
        <td class="px-6 py-4">—</td>
        <td class="px-6 py-4">${badge(statusLabel, typeForStatus(displayStatus))}${rawHint}</td>
        <td class="px-6 py-4 text-slate-500">${formatDate(a.created_at)}</td>
        <td class="px-6 py-4"><button class="evaluate-attempt-btn rounded-lg bg-intern-blue px-3 py-2 text-xs font-medium text-white" type="button" data-attempt="${a.attempt_id}">Evaluate</button></td>
      </tr>`;
      }
    );

    tbody.innerHTML =
      [...rows, ...pendingRows].join("") ||
      `<tr id="emptyResults"><td class="px-6 py-12 text-center text-sm text-slate-500" colspan="6">No results found</td></tr>`;
    refreshIcons();
    $$(".view-result-btn").forEach((btn) =>
      btn.addEventListener("click", () => showAttempt(btn.dataset.attempt)),
    );
    $$(".evaluate-attempt-btn").forEach((btn) =>
      btn.addEventListener("click", () => evaluateAttempt(btn.dataset.attempt)),
    );
    wireResultFilters();
  }

  async function showAttempt(attemptId) {
    try {
      const response = await fetch(
        `${API}?action=attempt&id=${encodeURIComponent(attemptId)}`,
      );
      const payload = await response.json();
      if (payload.status === "error") throw new Error(payload.message);
      const a = payload.data;
      const displayStatus = a.display_status || a.status;
      const rawStatus = a.status || "";
      const rawHint = rawStatus && rawStatus !== displayStatus ? ` <span class="text-xs text-slate-400">(${escapeHtml(rawStatus)})</span>` : "";
      modal(
        "Assessment Attempt",
        `
        <div class="grid gap-4 sm:grid-cols-2 text-sm">
          <div><p class="text-slate-400">Candidate</p><p class="font-medium">${escapeHtml(a.full_name)}</p></div>
          <div><p class="text-slate-400">Email</p><p class="font-medium">${escapeHtml(a.email)}</p></div>
          <div><p class="text-slate-400">Assessment</p><p class="font-medium">${escapeHtml(a.assessment_title)}</p></div>
          <div><p class="text-slate-400">Status</p>${badge(label(displayStatus), typeForStatus(displayStatus))}${rawHint}</div>
        </div>
        <div class="mt-5 space-y-3">
          ${(a.answers || []).map((x, i) => `<div class="rounded-xl border border-slate-100 p-4"><p class="text-sm font-medium text-slate-800">${i + 1}. ${escapeHtml(x.question_text)}</p><p class="mt-2 text-xs text-slate-500">Selected: ${escapeHtml(x.selected_option_text || "Not answered")}</p></div>`).join("") || '<p class="text-sm text-slate-500">No answers recorded.</p>'}
        </div>`,
      );
    } catch (e) {
      notify(e.message, true);
    }
  }

  async function evaluateAttempt(id) {
    if (!confirm("Evaluate this attempt now?")) return;
    try {
      const data = await api("evaluate", {
        method: "POST",
        body: { attempt_id: Number(id), generate_certificate: false },
      });
      notify(
        `Evaluated: ${data.score}/${data.total_questions} (${data.percentage}%), Level ${data.level}`,
      );
      await loadResults();
    } catch (e) {
      notify(e.message, true);
    }
  }

  function wireResultFilters() {
    const search = $("#resultSearch"),
      level = $("#resultLevelFilter"),
      status = $("#resultStatusFilter");
    const run = () => {
      const q = (search?.value || "").toLowerCase(),
        l = (level?.value || "").toLowerCase(),
        s = (status?.value || "").toLowerCase();
      $$("#resultsTableBody tr[data-result]").forEach((row) => {
        row.style.display =
          row.textContent.toLowerCase().includes(q) &&
          sameFilterValue(row.dataset.level, l) &&
          sameFilterValue(row.dataset.status, s)
            ? ""
            : "none";
      });
    };
    [search, level, status].forEach((el) => el?.addEventListener("input", run));
    [level, status].forEach((el) => el?.addEventListener("change", run));
  }

  async function loadCertificates() {
    const data = await api("certificates");
    const rows = data.certificates || [];
    const set = (id, v) => {
      const el = $("#" + id);
      if (el) el.textContent = v;
    };
    set("totalCertificates", rows.length);
    set("generatedCertificates", rows.length);
    set("verifiedCertificates", rows.length);
    set("pendingCertificates", 0);
    const tbody = $("#certificatesTableBody");
    if (!tbody) return;
    tbody.innerHTML = rows.length
      ? rows
          .map(
            (c) => `
      <tr class="border-b border-slate-100 last:border-0" data-certificate="true" data-level="level ${c.level}" data-status="verified">
        <td class="px-6 py-5 align-middle"><div><p class="font-medium text-slate-900">${escapeHtml(c.full_name)}</p><p class="mt-1 text-xs text-slate-500">${escapeHtml(c.email)}</p></div></td>
        <td class="px-6 py-5 align-middle">${badge(`Level ${c.level}`, "blue")}</td>
        <td class="px-6 py-5 align-middle font-medium text-slate-700">${escapeHtml(c.certificate_number)}</td>
        <td class="px-6 py-5 align-middle text-slate-500">${formatDate(c.issue_date)}</td>
        <td class="px-6 py-5 align-middle">${badge("Verified", "green")}</td>
        <td class="px-4 py-5 align-middle"><div class="flex items-center gap-1.5 whitespace-nowrap">
          <button class="view-certificate-btn inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-intern-blue hover:text-intern-blue" title="View certificate" type="button" data-id="${c.result_id}"><i data-lucide="eye" class="h-4 w-4"></i></button>
          <button class="download-certificate-btn inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-intern-blue hover:text-intern-blue" title="Download certificate" type="button" data-id="${c.result_id}"><i data-lucide="download" class="h-4 w-4"></i></button>
        </div></td>
      </tr>`,
          )
          .join("")
      : `<tr><td class="px-6 py-12 text-center text-sm text-slate-500" colspan="6">No certificates generated yet.</td></tr>`;
    refreshIcons();

    $$(".download-certificate-btn").forEach((btn) =>
      btn.addEventListener("click", () =>
        window.open(
          `/api/admin/certificate_pdf.php?result_id=${encodeURIComponent(btn.dataset.id)}`,
          "_blank",
        ),
      ),
    );
    $$(".view-certificate-btn").forEach((btn) =>
      btn.addEventListener("click", () =>
        window.open(
          `/api/admin/certificate_pdf.php?result_id=${encodeURIComponent(btn.dataset.id)}&view=1`,
          "_blank",
        ),
      ),
    );
    $$(".verify-certificate-btn").forEach((btn) =>
      btn.addEventListener("click", async () => {
        try {
          const response = await fetch(
            `${API}?action=certificate-verify&certificate_number=${encodeURIComponent(btn.dataset.number)}`,
            {
              credentials: "same-origin",
              headers: { Accept: "application/json" },
            },
          );
          const payload = await response.json();
          if (!response.ok || payload.status === "error")
            throw new Error(payload.message || "Verification failed.");
          const data = payload.data;
          if (data.verified)
            notify(
              `Verified: ${data.certificate.full_name} · Level ${data.certificate.level}`,
            );
          else notify("Certificate not found.", true);
        } catch (e) {
          notify(e.message, true);
        }
      }),
    );
    wireCertificateFilters();
  }

  function wireCertificateFilters() {
    const search = $("#certificateSearch"),
      level = $("#certificateLevelFilter"),
      status = $("#certificateStatusFilter");
    const run = () => {
      const q = (search?.value || "").toLowerCase(),
        l = (level?.value || "").toLowerCase(),
        s = (status?.value || "").toLowerCase();
      $$("#certificatesTableBody tr[data-certificate]").forEach((row) => {
        row.style.display =
          row.textContent.toLowerCase().includes(q) &&
          sameFilterValue(row.dataset.level, l) &&
          sameFilterValue(row.dataset.status, s)
            ? ""
            : "none";
      });
    };
    [search, level, status].forEach((el) => el?.addEventListener("input", run));
    [level, status].forEach((el) => el?.addEventListener("change", run));
  }

  let activeQuestionTab = "available";
  let cachedQuestionsData = null;

  async function loadQuestions() {
    const data = await api("questions");
    cachedQuestionsData = data;
    renderQuestionsView();
  }

  function renderQuestionsView() {
    if (!cachedQuestionsData) return;
    const allRows = cachedQuestionsData.questions || [];
    const counts = cachedQuestionsData.counts || {};
    
    const set = (id, v) => {
      const el = $("#" + id);
      if (el) el.textContent = v;
    };
    
    const availableRows = allRows.filter((q) => !q.is_used && q.approval_status !== "archived");
    const usedRows = allRows.filter((q) => q.is_used || q.approval_status === "archived");

    set("availableQuestions", counts.available ?? availableRows.length);
    set("approvedQuestions", counts.approved ?? availableRows.filter((q) => q.approval_status === "approved").length);
    set("pendingQuestions", counts.pending ?? availableRows.filter((q) => q.approval_status === "pending").length);
    set("usedQuestions", counts.used ?? usedRows.length);
    set("badgeAvailableCount", availableRows.length);
    set("badgeUsedCount", usedRows.length);

    // Style tabs
    const tabAvail = $("#tabAvailableQuestions");
    const tabUsed = $("#tabUsedQuestions");
    const banner = $("#tabBanner");
    const bannerText = $("#tabBannerText");

    if (activeQuestionTab === "available") {
      if (tabAvail) {
        tabAvail.className = "px-5 py-3 text-sm font-semibold border-b-2 border-intern-blue text-intern-blue flex items-center gap-2 transition";
      }
      if (tabUsed) {
        tabUsed.className = "px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-700 flex items-center gap-2 transition";
      }
      if (banner) banner.className = "px-6 py-3 bg-blue-50/50 border-b border-blue-100 text-xs font-medium text-blue-700 flex items-center gap-2";
      if (bannerText) bannerText.textContent = "Showing active questions available to be served in upcoming batch assessments.";
    } else {
      if (tabAvail) {
        tabAvail.className = "px-5 py-3 text-sm font-semibold border-b-2 border-transparent text-slate-500 hover:text-slate-700 flex items-center gap-2 transition";
      }
      if (tabUsed) {
        tabUsed.className = "px-5 py-3 text-sm font-semibold border-b-2 border-purple-600 text-purple-700 flex items-center gap-2 transition";
      }
      if (banner) banner.className = "px-6 py-3 bg-purple-50/50 border-b border-purple-100 text-xs font-medium text-purple-700 flex items-center gap-2";
      if (bannerText) bannerText.textContent = "Showing questions that have already appeared in batch exams. They are safely archived and will never appear in available pools, preserving candidate history.";
    }

    const rowsToDisplay = activeQuestionTab === "available" ? availableRows : usedRows;
    const tbody = $("#questionsTableBody");
    if (!tbody) return;

    tbody.innerHTML = rowsToDisplay.length
      ? rowsToDisplay
          .map((q) => {
            const m = String(q.question_bank || "").match(/level\s*([1-5])/i);
            const level = m ? m[1] : "—";
            const allOptsHtml = (q.all_options || '').split('|||').map(o => {
              if (!o.trim()) return '';
              const isCorrect = o.startsWith('[✓]');
              const text = o.replace(/^\[[✓ ]\] /, '');
              return `<div class="text-sm mt-1 ${isCorrect ? 'text-green-600 font-medium' : 'text-slate-500'}">
                <span class="inline-block w-4">${isCorrect ? '✓' : '•'}</span> ${escapeHtml(text)}
              </div>`;
            }).join('');

            const isArchived = q.is_used || q.approval_status === "archived";
            const statusDisplay = isArchived
              ? badge("Used in Exam", "purple")
              : badge(label(q.approval_status), typeForStatus(q.approval_status));

            const usageText = isArchived
              ? `<span class="inline-flex items-center gap-1 text-purple-600 font-medium"><i data-lucide="history" class="h-3 w-3"></i> Already Appeared in Exam</span>`
              : `<span class="text-slate-400">${escapeHtml(q.question_bank)} · ${Number(q.option_count || 0)} options</span>`;

            const actionsHtml = isArchived
              ? `<span class="inline-flex items-center gap-1 text-xs text-purple-700 font-medium bg-purple-50 px-2.5 py-1.5 rounded-lg border border-purple-100">
                  <i data-lucide="shield-check" class="h-3.5 w-3.5"></i> History Preserved
                </span>`
              : `<div class="flex gap-2">
                  ${q.approval_status !== "approved" ? `<button class="approve-question rounded-lg bg-green-50 px-3 py-2 text-xs font-medium text-green-600 hover:bg-green-100" data-id="${q.id}">Approve</button>` : ""}
                  ${q.approval_status === "pending" ? `<button class="reject-question rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100" data-id="${q.id}">Reject</button>` : ""}
                </div>`;

            return `<tr data-question="true" data-level="${m ? `level ${m[1]}` : ""}" data-status="${escapeHtml(q.approval_status)}" data-used="${isArchived ? "1" : "0"}">
        <td class="px-6 py-4">
          <p class="max-w-xl font-medium text-slate-800">${escapeHtml(q.question_text)}</p>
          <div class="mt-3 mb-3 pl-2 border-l-2 border-slate-200">
            ${allOptsHtml}
          </div>
          <p class="mt-1 text-xs">${usageText}</p>
        </td>
        <td class="px-6 py-4">${level === "—" ? "—" : badge(`Level ${level}`, "blue")}</td>
        <td class="px-6 py-4 text-slate-500">${escapeHtml(q.type || "MCQ")}</td>
        <td class="px-6 py-4">${statusDisplay}</td>
        <td class="px-6 py-4">${actionsHtml}</td>
      </tr>`;
          })
          .join("")
      : `<tr id="emptyQuestions"><td class="px-6 py-12 text-center text-sm text-slate-500" colspan="5">
          ${activeQuestionTab === "available" ? "No available questions found in the active pool." : "No questions have been used/archived from exams yet."}
        </td></tr>`;

    refreshIcons();

    $$(".approve-question").forEach(
      (b) => (b.onclick = () => setQuestionStatus(b.dataset.id, "approved")),
    );
    $$(".reject-question").forEach(
      (b) => (b.onclick = () => setQuestionStatus(b.dataset.id, "rejected")),
    );
    wireQuestionTabs();
    wireQuestionFilters();
  }

  function wireQuestionTabs() {
    const tabAvail = $("#tabAvailableQuestions");
    const tabUsed = $("#tabUsedQuestions");
    if (tabAvail && !tabAvail.dataset.bound) {
      tabAvail.dataset.bound = "1";
      tabAvail.onclick = () => {
        activeQuestionTab = "available";
        renderQuestionsView();
      };
    }
    if (tabUsed && !tabUsed.dataset.bound) {
      tabUsed.dataset.bound = "1";
      tabUsed.onclick = () => {
        activeQuestionTab = "used";
        renderQuestionsView();
      };
    }
  }

  async function setQuestionStatus(id, status) {
    try {
      await api("question-status", {
        method: "POST",
        body: { question_id: Number(id), status },
      });
      notify(`Question ${status}.`);
      await loadQuestions();
    } catch (e) {
      notify(e.message, true);
    }
  }

  function wireQuestionFilters() {
    const search = $("#questionSearch"),
      level = $("#questionLevelFilter"),
      status = $("#questionStatusFilter");
    const run = () => {
      const q = (search?.value || "").toLowerCase(),
        l = (level?.value || "").toLowerCase(),
        s = (status?.value || "").toLowerCase();
      $$("#questionsTableBody tr[data-question]").forEach(
        (row) =>
          (row.style.display =
            row.textContent.toLowerCase().includes(q) &&
            sameFilterValue(row.dataset.level, l) &&
            sameFilterValue(row.dataset.status, s)
              ? ""
              : "none"),
      );
    };
    [search, level, status].forEach((el) => el?.addEventListener("input", run));
    [level, status].forEach((el) => el?.addEventListener("change", run));
  }

  async function loadBatches() {
    const data = await api("batches");
    const eligible = data.eligible_candidates || [],
      slots = data.slots || [],
      batches = data.batches || [],
      assessments = data.assessments || [];

    const assessSelect = $("#assessmentSelect");
    if (assessSelect) {
      assessSelect.innerHTML = '<option value="">Select Assessment</option>' + 
        assessments.map(a => `<option value="${a.id}">${escapeHtml(a.title)}</option>`).join("");
    }

    const provForm = $("#createProvisionalSlotForm");
    if (provForm && !provForm.dataset.bound) {
      provForm.dataset.bound = "1";
      provForm.onsubmit = async (e) => {
        e.preventDefault();
        const btn = provForm.querySelector('button[type="submit"]');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = `<i class="ri-loader-4-line animate-spin"></i> Creating...`;
        }
        try {
          await api("provisional_batch", {
            method: "POST",
            body: Object.fromEntries(new FormData(provForm)),
          });
          notify("Provisional slot created successfully!");
          provForm.reset();
          await loadBatches();
        } catch (err) {
          notify(err.message, true);
        } finally {
          if (btn) {
            btn.disabled = false;
            btn.innerHTML = `<i data-lucide="calendar-check" class="h-4 w-4"></i> Create Provisional Slot`;
            refreshIcons();
          }
        }
      };
    }

    const slotBatchSelect = $("#slotBatchSelect");
    if (slotBatchSelect) {
      slotBatchSelect.innerHTML = '<option value="">Select Batch</option>' + 
        batches.map(b => `<option value="${b.id}">${escapeHtml(b.batch_number)}</option>`).join("");
    }

    const addSlotForm = $("#addSlotForm");
    if (addSlotForm && !addSlotForm.dataset.bound) {
      addSlotForm.dataset.bound = "1";
      addSlotForm.onsubmit = async (e) => {
        e.preventDefault();
        const btn = addSlotForm.querySelector('button[type="submit"]');
        if (btn) btn.disabled = true;
        try {
          await api("slot", {
            method: "POST",
            body: Object.fromEntries(new FormData(addSlotForm)),
          });
          notify("Slot added successfully!");
          addSlotForm.reset();
          document.getElementById('addSlotModal').classList.add('hidden');
          await loadBatches();
        } catch (err) {
          notify(err.message, true);
        } finally {
          if (btn) btn.disabled = false;
        }
      };
    }

    const set = (id, v) => {
      const el = $("#" + id);
      if (el) el.textContent = v;
    };
    set("eligibleCandidateCount", eligible.filter((c) => !c.batch_id).length);
    set(
      "availableSlotCount",
      slots.filter(s => s.schedule_status !== 'provisional').reduce((s, x) => s + Number(x.seats_remaining || 0), 0),
    );
    const slotBody = $("#slotsTableBody");
    if (slotBody)
      slotBody.innerHTML = slots.length
        ? slots
            .map(
              (s) => `
      <tr class="hover:bg-slate-50">
        <td class="px-4 py-3 font-medium font-mono text-xs">${escapeHtml(s.batch_number)}</td>
        <td class="px-4 py-3 text-slate-500 text-xs">${escapeHtml(s.start_time?.slice(0, 5) || "")} - ${escapeHtml(s.end_time?.slice(0, 5) || "")}</td>
        <td class="px-4 py-3 text-xs">${s.schedule_status === 'provisional' ? 'N/A' : s.capacity}</td><td class="px-4 py-3 text-xs">${s.allocated}</td><td class="px-4 py-3 text-xs">${s.schedule_status === 'provisional' ? 'N/A' : s.seats_remaining}</td>
        <td class="px-4 py-3 text-xs">${badge(s.schedule_status === 'provisional' ? 'Provisional' : (s.seats_remaining > 0 ? 'Available' : 'Full'), s.schedule_status === 'provisional' ? 'amber' : (s.seats_remaining > 0 ? 'green' : 'red'))}</td>
        <td class="px-4 py-3 text-right">
          <button class="delete-batch rounded-lg bg-red-50 hover:bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600 transition" data-batch-id="${s.batch_id}">Delete</button>
        </td>
      </tr>`,
            )
            .join("")
        : `<tr><td class="px-6 py-10 text-center text-sm text-slate-500" colspan="7">No slots created yet.</td></tr>`;
    refreshIcons();

    $$(".delete-batch").forEach(
      (btn) =>
        (btn.onclick = async () => {
          if (!confirm("Are you sure you want to delete this batch and its slot?")) return;
          try {
            await api("batch_delete", {
              method: "POST",
              body: { batch_id: Number(btn.dataset.batchId) },
            });
            notify("Batch deleted successfully.");
            await loadBatches();
          } catch (e) {
            notify(e.message, true);
          }
        }),
    );

    const allocBody = $("#allocationTableBody");
    const unallocated = eligible.filter((c) => !c.batch_id);
    if (allocBody)
      allocBody.innerHTML = unallocated.length
        ? unallocated
            .map((c) => {
              const options = batches.filter(
                (b) => Number(b.assessment_id) === Number(c.assessment_id),
              );
              const matchingSlots = slots.filter(
                (s) =>
                  options.some((b) => Number(b.id) === Number(s.batch_id)),
              );
              return `<tr class="hover:bg-slate-50">
        <td class="px-6 py-4 font-medium">${escapeHtml(c.full_name)}</td>
        <td class="px-6 py-4 text-slate-500">${c.level_assigned ? `Level ${escapeHtml(c.level_assigned)}` : "—"}</td>
        <td class="px-6 py-4">${badge("Eligible", "green")}</td>
        <td class="px-6 py-4">
          <select class="allocation-slot rounded-lg border border-slate-200 px-2 py-2 text-xs" data-enrollment="${c.enrollment_id}">
            <option value="">Select slot</option>
            ${matchingSlots.map((s) => `<option value="${s.slot_id}">${escapeHtml(s.batch_number)} · ${escapeHtml(s.start_time.slice(0, 5))}</option>`).join("")}
          </select>
        </td>
        <td class="px-6 py-4"><button class="allocate-candidate rounded-lg bg-intern-blue px-3 py-2 text-xs font-medium text-white" data-enrollment="${c.enrollment_id}">Assign</button></td>
      </tr>`;
            })
            .join("")
        : `<tr><td class="px-6 py-10 text-center text-sm text-slate-500" colspan="5">No eligible candidates available for allocation.</td></tr>`;

    $$(".allocate-candidate").forEach(
      (btn) =>
        (btn.onclick = async () => {
          const select = $(
            `.allocation-slot[data-enrollment="${btn.dataset.enrollment}"]`,
          );
          const slotId = Number(select?.value || 0);
          if (!slotId) {
            notify("Select a slot first.", true);
            return;
          }
          const slot = slots.find((s) => Number(s.slot_id) === slotId);
          try {
            await api("allocate", {
              method: "POST",
              body: {
                enrollment_id: Number(btn.dataset.enrollment),
                batch_id: Number(slot.batch_id),
                slot_id: slotId,
              },
            });
            notify("Candidate allocated.");
            await loadBatches();
          } catch (e) {
            notify(e.message, true);
          }
        }),
    );

    const pendingRequestsBody = $("#pendingRequestsTableBody");
    const pendingRequests = [...(data.pending_requests || [])].sort((a, b) => {
      const aReady = a.candidate_count >= 100 ? 1 : 0;
      const bReady = b.candidate_count >= 100 ? 1 : 0;
      if (aReady !== bReady) return bReady - aReady;
      return new Date(a.preferred_date) - new Date(b.preferred_date);
    });

    // Alert notification logic for 100+ candidates threshold
    const readyRequests = pendingRequests.filter((r) => Number(r.candidate_count) >= 100);
    const alertContainer = $("#pendingBatchAlertContainer");
    if (readyRequests.length > 0) {
      if (alertContainer) {
        alertContainer.innerHTML = `
          <div class="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-center justify-between shadow-sm">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold text-xl shadow-xs">🔔</div>
              <div>
                <div class="font-bold text-sm text-amber-950">Action Required: 100+ Candidate Threshold Reached!</div>
                <div class="text-xs text-amber-800 mt-0.5">${readyRequests.length} pending request group(s) have reached 100 or more candidates. Please click "Create Batch" below to create the batch.</div>
              </div>
            </div>
          </div>`;
      }
      notify(`🔔 Action Required: ${readyRequests.length} batch request(s) reached 100+ candidates! Create batch now.`);
    } else if (alertContainer) {
      alertContainer.innerHTML = "";
    }

    if (pendingRequestsBody) {
      if (pendingRequests.length === 0) {
        pendingRequestsBody.innerHTML = `<tr><td colspan="3" class="px-4 py-8 text-center text-sm text-slate-500">No pending batch requests.</td></tr>`;
      } else {
        pendingRequestsBody.innerHTML = pendingRequests.map(r => `
          <tr class="hover:bg-slate-50">
            <td class="px-4 py-4"><div class="font-medium text-slate-800">${escapeHtml(r.preferred_date)}</div><div class="text-xs text-slate-500">${escapeHtml(r.assessment_title)}<br>${escapeHtml(r.preferred_time_slot)}</div></td>
            <td class="px-4 py-4 font-medium ${r.candidate_count >= 100 ? 'text-green-600' : 'text-amber-600'}">${r.candidate_count} <span class="text-xs text-slate-400 font-normal">/ 100</span></td>
            <td class="px-4 py-4">
              <button class="btn-create-auto-batch rounded-lg px-3 py-2 text-xs font-medium text-white ${r.candidate_count >= 100 ? 'bg-intern-blue hover:bg-blue-700' : 'bg-slate-300 cursor-not-allowed'}" 
                data-assessment="${r.assessment_id}" data-schedule="${r.schedule_id}" 
                ${r.candidate_count >= 100 ? '' : 'disabled'}>
                Create Batch
              </button>
            </td>
          </tr>
        `).join("");

        $$(".btn-create-auto-batch").forEach(btn => {
          btn.addEventListener("click", async () => {
            const assessmentId = Number(btn.dataset.assessment);
            const scheduleId = Number(btn.dataset.schedule);
            const originalText = btn.textContent;
            btn.disabled = true;
            btn.textContent = "Processing...";
            try {
              const token = await getCsrfToken();
              const response = await fetch("/api/slots/auto_batch.php", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Accept": "application/json",
                  "X-CSRF-Token": token
                },
                body: JSON.stringify({
                  assessment_id: assessmentId,
                  schedule_id: scheduleId
                })
              });
              const payload = await response.json();
              if (!response.ok || payload.status !== "success") {
                throw new Error(payload.message || "Failed to process batch");
              }
              notify("Batch created and candidates allocated successfully!");
              await loadBatches();
            } catch (err) {
              notify(err.message, true);
              btn.disabled = false;
              btn.textContent = originalText;
            }
          });
        });
      }
    }

    const createSlot = $("#createSlotButton");
    if (createSlot && !createSlot.dataset.bound) {
      createSlot.dataset.bound = "1";
      createSlot.addEventListener("click", async () => {
        if (!batches.length) {
          notify("Create a batch first.", true);
          return;
        }
        let batch =
          batches.find((b) => b.schedule_status === "scheduled") || batches[0];
        if (batches.length > 1) {
          const choice = prompt(
            `Batch name:\n${batches.map((b) => b.batch_number).join("\n")}`,
            batch.batch_number,
          );
          if (choice === null) return;
          batch =
            batches.find(
              (b) =>
                b.batch_number.toLowerCase() === choice.trim().toLowerCase(),
            ) || batch;
        }
        const start = prompt("Start time (HH:MM):", "10:00");
        if (start === null) return;
        const end = prompt("End time (HH:MM):", "11:00");
        if (end === null) return;
        const cap = Number(prompt("Slot capacity:", "50"));
        if (!cap) return;
        try {
          await api("slot", {
            method: "POST",
            body: {
              batch_id: Number(batch.id),
              start_time: start,
              end_time: end,
              capacity: cap,
            },
          });
          notify("Slot created.");
          await loadBatches();
        } catch (err) {
          notify(err.message, true);
        }
      });
    }
  }

  let currentPlacementRows = [];

  function escapeCsvCell(value) {
    let str = String(value ?? "");

    // Prevent CSV/Excel formula injection by prepending a single quote
    // if the value starts with a formula trigger character
    if (/^[=+\-@]/.test(str)) {
      str = "'" + str;
    }

    if (/[",\r\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function generateCsv(headers, rows) {
    const headerLine = headers.map(escapeCsvCell).join(",");
    const dataLines = rows.map((row) => row.map(escapeCsvCell).join(","));
    return [headerLine, ...dataLines].join("\r\n");
  }

  function downloadCsv(filename, csvContent) {
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const professionalLevelInfo = (level) => {
    const levels = {
      1: "Highly Proficient",
      2: "Proficient",
      3: "Job Ready",
      4: "Development Required",
      5: "Training Required",
    };
    return levels[Number(level)] || "-";
  };

  const mergedPlacementStatus = (placement) => {
    return professionalLevelInfo(placement.level_assigned);
  };

  const mergedPlacementStatusHtml = (placement) => {
    const professionalStatus = professionalLevelInfo(placement.level_assigned);
    return badge(professionalStatus, "blue");
  };

  function exportPlacementCsv() {
    const search = $("#placementSearch"),
      level = $("#placementLevelFilter");

    const q = (search?.value || "").toLowerCase(),
      l = (level?.value || "").toLowerCase(),
      s = "";

    const filtered = currentPlacementRows.filter((p) => {
      const levelStr = p.level_assigned ? `level ${p.level_assigned}` : "";
      const statusStr = professionalLevelInfo(p.level_assigned);

      const searchableText = `${p.full_name || ""} ${p.email || ""} ${p.phone || ""} ${p.company_name || ""} ${p.notes || ""} ${levelStr} ${statusStr}`.toLowerCase();

      return (
        searchableText.includes(q) &&
        sameFilterValue(levelStr, l) &&
        sameFilterValue(statusStr, s)
      );
    });

    if (!filtered.length) {
      notify("No placement records to export.", true);
      return;
    }

    const headers = [
      "Candidate Name",
      "Email",
      "Phone",
      "Level",
      "Percentage",
      "Company Name",
      "Notes",
      "Updated Date",
    ];

    const rows = filtered.map((p) => [
      p.full_name || "",
      p.email || "",
      p.phone || "",
      p.level_assigned ? `Level ${p.level_assigned}` : "—",
      p.percentage !== null && p.percentage !== undefined ? `${p.percentage}%` : "—",
      p.company_name || "",
      p.notes || "",
      p.updated_at || "",
    ]);

    const csvContent = generateCsv(headers, rows);
    const dateStr = new Date().toISOString().slice(0, 10);
    downloadCsv(`internboot-placements-${dateStr}.csv`, csvContent);
    notify(`Exported ${filtered.length} placement record${filtered.length === 1 ? "" : "s"}.`);
  }

  // ─── JOB DESCRIPTIONS (JD) MANAGEMENT ──────────────────────────────────────

  async function apiJobs(action, opts = {}) {
    const method = opts.method || 'GET';
    const url    = `/api/admin/jobs.php?action=${action}`;
    const fetchOpts = { method, credentials: 'same-origin', headers: { Accept: 'application/json' } };
    if (method.toUpperCase() === 'POST') {
      const token = await getCsrfToken();
      fetchOpts.headers['X-CSRF-Token'] = token;
    }
    
    if (opts.body) {
      if (opts.body instanceof FormData) {
        fetchOpts.body = opts.body;
      } else {
        fetchOpts.headers['Content-Type'] = 'application/json';
        fetchOpts.body = JSON.stringify(opts.body);
      }
    }
    const res     = await fetch(url, fetchOpts);
    const payload = await res.json();
    if (payload.status === 'error') throw new Error(payload.message || 'API error');
    return payload.data;
  }

  const LEVEL_COLORS = ['','bg-purple-100 text-purple-700','bg-blue-100 text-blue-700','bg-cyan-100 text-cyan-700','bg-amber-100 text-amber-700','bg-slate-100 text-slate-700'];

  function renderJdCards(jobs) {
    const grid     = $('#jdGrid');
    const emptyMsg = $('#jdEmptyState');
    if (!grid) return;

    // Remove previous cards (keep the empty-state node)
    grid.querySelectorAll('.jd-card').forEach(c => c.remove());

    if (!jobs || !jobs.length) {
      if (emptyMsg) emptyMsg.classList.remove('hidden');
      return;
    }
    if (emptyMsg) emptyMsg.classList.add('hidden');

    jobs.forEach(j => {
      const levels = String(j.target_levels || '').split(',').map(x => x.trim()).filter(Boolean);
      const levelBadges = levels.map(l =>
        `<span class="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${LEVEL_COLORS[+l] || 'bg-slate-100 text-slate-700'}">L${l}</span>`
      ).join(' ');

      const statusBadge = j.status === 'active'
        ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Active</span>`
        : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Inactive</span>`;

      const card = document.createElement('div');
      card.className = 'jd-card bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition';
      card.innerHTML = `
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="font-bold text-slate-800 truncate">${escapeHtml(j.job_title)}</p>
            <p class="text-[13px] text-slate-500 truncate">${escapeHtml(j.company_name)}</p>
          </div>
          ${statusBadge}
        </div>

        <div class="flex flex-wrap gap-1 items-center">
          <span class="text-[11px] text-slate-400 mr-1">Levels:</span>
          ${levelBadges}
        </div>

        ${j.description ? `<p class="text-[13px] text-slate-500 leading-relaxed line-clamp-2">${escapeHtml(j.description)}</p>` : ''}

        <div class="flex gap-2 flex-wrap text-[12px] text-slate-400">
          ${j.salary_range  ? `<span class="flex items-center gap-1"><i data-lucide="indian-rupee" class="w-3 h-3"></i>${escapeHtml(j.salary_range)}</span>` : ''}
          ${j.location      ? `<span class="flex items-center gap-1"><i data-lucide="map-pin" class="w-3 h-3"></i>${escapeHtml(j.location)}</span>` : ''}
          ${j.jd_pdf_path   ? `<a href="/api/jd_file.php?id=${j.id}" target="_blank" class="flex items-center gap-1 text-intern-blue hover:underline"><i data-lucide="file-text" class="w-3 h-3"></i>View PDF</a>` : ''}
          ${j.apply_link    ? `<a href="${escapeHtml(j.apply_link)}" target="_blank" class="flex items-center gap-1 text-intern-blue hover:underline"><i data-lucide="external-link" class="w-3 h-3"></i>Ext. Link</a>` : ''}
          <span class="flex items-center gap-1 ml-auto"><i data-lucide="users" class="w-3 h-3"></i>${j.application_count || 0} applied</span>
        </div>

        <div class="border-t border-slate-100 pt-3 flex gap-2 flex-wrap">
          <button class="jd-edit-btn flex-1 min-w-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-600 hover:bg-slate-50 transition" data-id="${j.id}">
            <i data-lucide="edit" class="w-3.5 h-3.5"></i> Edit
          </button>
          <button class="jd-toggle-btn flex-1 min-w-0 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-[12px] font-medium transition
            ${j.status === 'active' ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}"
            data-id="${j.id}" data-status="${escapeHtml(j.status)}">
            <i data-lucide="${j.status === 'active' ? 'eye-off' : 'eye'}" class="w-3.5 h-3.5"></i>
            ${j.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          <button class="jd-applicants-btn flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 text-blue-700 text-[12px] font-medium hover:bg-blue-50 transition"
            data-id="${j.id}" data-title="${escapeHtml(j.job_title)}">
            <i data-lucide="users" class="w-3.5 h-3.5"></i>
            Applicants
          </button>
          <button class="jd-delete-btn flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-[12px] font-medium hover:bg-red-50 transition"
            data-id="${j.id}" data-title="${escapeHtml(j.job_title)}">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
          </button>
        </div>
      `;
      grid.appendChild(card);
    });

    if (typeof lucide !== 'undefined') lucide.createIcons();

    // Wire toggle buttons
    grid.querySelectorAll('.jd-toggle-btn').forEach(btn => {
      btn.onclick = async () => {
        const newStatus = btn.dataset.status === 'active' ? 'inactive' : 'active';
        try {
          await apiJobs('update_status', { method: 'POST', body: { job_id: +btn.dataset.id, status: newStatus } });
          notify(`JD ${newStatus === 'active' ? 'activated' : 'deactivated'}.`);
          await loadJobs();
        } catch (e) { notify(e.message, true); }
      };
    });

    // Wire delete buttons
    grid.querySelectorAll('.jd-delete-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm(`Delete "${btn.dataset.title}"? This cannot be undone.`)) return;
        try {
          await apiJobs('delete', { method: 'POST', body: { job_id: +btn.dataset.id } });
          notify('JD deleted.');
          await loadJobs();
        } catch (e) { notify(e.message, true); }
      };
    });

    // Wire edit buttons
    grid.querySelectorAll('.jd-edit-btn').forEach(btn => {
      btn.onclick = () => {
        const job = jobs.find(j => j.id == btn.dataset.id);
        if (job) openPostJdModal(job);
      };
    });

    // Wire applicants buttons
    grid.querySelectorAll('.jd-applicants-btn').forEach(btn => {
      btn.onclick = async () => {
        try {
          const apps = await apiJobs(`applications&job_id=${btn.dataset.id}`);
          const list = Array.isArray(apps) ? apps : [];
          
          function renderTable() {
            const rows = list.length
              ? list.map(a => `
                <tr class="border-b border-slate-100 last:border-0">
                  <td class="px-4 py-3 font-medium text-slate-800">${escapeHtml(a.full_name)}</td>
                  <td class="px-4 py-3 text-slate-500">${escapeHtml(a.email || '—')}</td>
                  <td class="px-4 py-3">${a.level_assigned ? `<span class="px-2 py-0.5 rounded-full text-[11px] font-semibold ${LEVEL_COLORS[+a.level_assigned] || 'bg-slate-100 text-slate-700'}">L${a.level_assigned}</span>` : '—'}</td>
                  <td class="px-4 py-3 text-slate-500">${a.percentage !== null && a.percentage !== undefined ? a.percentage + '%' : '—'}</td>
                  <td class="px-4 py-3 text-slate-400 text-xs">${formatDate(a.applied_at)}</td>
                  <td class="px-4 py-3 text-right">
                    <button class="delete-app-btn text-red-500 hover:text-red-700 p-1" data-id="${a.application_id}" title="Delete Application"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                  </td>
                </tr>`).join('')
              : `<tr><td colspan="6" class="px-4 py-8 text-center text-slate-400 text-sm">No applications yet</td></tr>`;
              
            return rows;
          }

          const root = modal(`Applicants – ${escapeHtml(btn.dataset.title)}`, `
            <div class="flex justify-end mb-3">
              <button id="exportAppsBtn" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-[13px] font-semibold hover:bg-emerald-100 transition shadow-sm">
                <i data-lucide="download" class="h-4 w-4"></i> Export CSV
              </button>
            </div>
            <div class="overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead class="bg-slate-50 text-slate-500 text-xs uppercase">
                  <tr>
                    <th class="px-4 py-2">Name</th>
                    <th class="px-4 py-2">Email</th>
                    <th class="px-4 py-2">Level</th>
                    <th class="px-4 py-2">Score</th>
                    <th class="px-4 py-2">Applied</th>
                    <th class="px-4 py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody id="appsTbody">${renderTable()}</tbody>
              </table>
            </div>
          `);

          $('#exportAppsBtn', root).onclick = () => {
            if (!list.length) return alert('No applicants to export');
            let csv = 'Name,Email,Level,Score,Applied At\n';
            list.forEach(a => {
              csv += `"${(a.full_name||'').replace(/"/g,'""')}","${(a.email||'').replace(/"/g,'""')}",${a.level_assigned||''},${a.percentage||''},"${formatDate(a.applied_at)}"\n`;
            });
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `Applicants_${btn.dataset.title.replace(/\s+/g,'_')}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          };

          function attachDeleteHandlers() {
            $$('.delete-app-btn', root).forEach(delBtn => {
              delBtn.onclick = async () => {
                if (!confirm("Are you sure you want to delete this applicant's record from this job?")) return;
                try {
                  await apiJobs('delete_application', {
                    method: 'POST',
                    body: { application_id: +delBtn.dataset.id }
                  });
                  notify('Application deleted successfully');
                  // Remove from local list and re-render
                  const idx = list.findIndex(a => a.application_id == delBtn.dataset.id);
                  if (idx > -1) list.splice(idx, 1);
                  $('#appsTbody', root).innerHTML = renderTable();
                  attachDeleteHandlers();
                  if (window.lucide && typeof window.lucide.createIcons === 'function') window.lucide.createIcons();
                  // Also refresh the background jobs grid to update applied count
                  loadJobs();
                } catch (e) {
                  notify(e.message, true);
                }
              };
            });
          }
          attachDeleteHandlers();
          
        } catch (e) { notify(e.message, true); }
      };
    });
  }

  function openPostJdModal(job = null) {
    const isEdit = !!job;
    const root = modal(isEdit ? 'Edit Job Description' : 'Post New Job Description', `
      <form id="postJdForm" class="space-y-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label class="block text-sm text-slate-600">Company Name *
            <input id="jdCompany" value="${isEdit ? escapeHtml(job.company_name) : ''}" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-intern-blue/20" placeholder="e.g. Infosys" required />
          </label>
          <label class="block text-sm text-slate-600">Job Title *
            <input id="jdTitle" value="${isEdit ? escapeHtml(job.job_title) : ''}" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-intern-blue/20" placeholder="e.g. Software Engineer" required />
          </label>
        </div>

        <label class="block text-sm text-slate-600">Description
          <textarea id="jdDesc" rows="3" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-intern-blue/20" placeholder="Brief job description...">${isEdit ? escapeHtml(job.description || '') : ''}</textarea>
        </label>

        <div>
          <p class="text-sm font-medium text-slate-700 mb-2">Target Levels * <span class="text-[12px] text-slate-400 font-normal">(select which levels can see this JD)</span></p>
          <div class="flex flex-wrap gap-3">
            ${[1,2,3,4,5].map(l => `
              <label class="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" name="jd_level" value="${l}" ${isEdit && (job.target_levels||'').split(',').includes(String(l)) ? 'checked' : ''} class="jd-level-chk w-4 h-4 rounded border-slate-300 accent-intern-blue" />
                <span class="text-sm text-slate-600">Level ${l}</span>
              </label>`).join('')}
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label class="block text-sm text-slate-600">Salary Range
            <input id="jdSalary" value="${isEdit ? escapeHtml(job.salary_range || '') : ''}" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-intern-blue/20" placeholder="e.g. ₹4–6 LPA" />
          </label>
          <label class="block text-sm text-slate-600">Location
            <input id="jdLocation" value="${isEdit ? escapeHtml(job.location || '') : ''}" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-intern-blue/20" placeholder="e.g. Bangalore / Remote" />
          </label>
        </div>
        
        <label class="block text-sm text-slate-600">Upload JD PDF (Optional)
          <input type="file" id="jdPdf" accept="application/pdf" class="mt-1 w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          ${isEdit && job.jd_pdf_path ? `<p class="text-[11px] text-slate-400 mt-1">Leave empty to keep existing PDF.</p>` : ''}
        </label>
        
        <label class="block text-sm text-slate-600">External Apply Link (Optional)
          <input id="jdApplyLink" value="${isEdit ? escapeHtml(job.apply_link || '') : ''}" type="url" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-intern-blue/20" placeholder="e.g. https://forms.gle/... or company career page" />
          <p class="text-[11px] text-slate-400 mt-1">If provided, the "Apply Now" button will track the click internally and then redirect the student to this URL.</p>
        </label>

        <button type="submit" class="w-full rounded-xl bg-intern-blue px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition">
          ${isEdit ? 'Save Changes' : 'Post Job Description'}
        </button>
      </form>
    `);

    $('#postJdForm', root).onsubmit = async (e) => {
      e.preventDefault();
      const levels = [...$$('.jd-level-chk', root).filter(c => c.checked)].map(c => c.value).join(',');
      if (!levels) { notify('Please select at least one target level.', true); return; }

      const submitBtn = $('button[type="submit"]', root);
      submitBtn.disabled = true;
      submitBtn.textContent = isEdit ? 'Saving...' : 'Posting...';

      try {
        const formData = new FormData();
        if (isEdit) formData.append('id', job.id);
        formData.append('company_name', $('#jdCompany', root).value.trim());
        formData.append('job_title', $('#jdTitle', root).value.trim());
        formData.append('description', $('#jdDesc', root).value.trim());
        formData.append('target_levels', levels);
        formData.append('salary_range', $('#jdSalary', root).value.trim());
        formData.append('location', $('#jdLocation', root).value.trim());
        formData.append('apply_link', $('#jdApplyLink', root).value.trim());
        
        const pdfInput = $('#jdPdf', root);
        if (pdfInput.files && pdfInput.files.length > 0) {
          formData.append('jd_pdf', pdfInput.files[0]);
        }

        await apiJobs(isEdit ? 'edit' : 'create', {
          method: 'POST',
          body: formData
        });
        root.remove();
        notify(isEdit ? 'Job description updated successfully!' : 'Job description posted successfully!');
        await loadJobs();
      } catch (err) {
        notify(err.message, true);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Post Job Description';
      }
    };
  }

  async function loadJobs() {
    try {
      const jobs = await apiJobs('list');
      renderJdCards(Array.isArray(jobs) ? jobs : []);
    } catch (e) {
      console.error('loadJobs error:', e);
    }

    // Wire "Post New JD" button (idempotent)
    const postBtn = $('#postNewJdBtn');
    if (postBtn && !postBtn.dataset.bound) {
      postBtn.dataset.bound = '1';
      postBtn.onclick = openPostJdModal;
    }
  }

  // ────────────────────────────────────────────────────────────────────────────

  async function loadPlacements() {

    const data = await api("placements"),
      rows = data.placements || [];
    currentPlacementRows = rows;
    const set = (id, v) => {
      const el = $("#" + id);
      if (el) el.textContent = v;
    };
    set(
      "placementReadyCount",
      rows.filter((p) => p.placement_status === "eligible").length,
    );
    set(
      "placementLevel1Count",
      rows.filter((p) => Number(p.level_assigned) === 1).length,
    );
    set(
      "placementLevel2Count",
      rows.filter((p) => Number(p.level_assigned) === 2).length,
    );
    [3, 4, 5].forEach((level) => {
      set(`placementLevel${level}Count`, rows.filter((p) => Number(p.level_assigned) === level).length);
    });
    set(
      "placedCount",
      rows.filter((p) => p.placement_status === "placed").length,
    );
    const tbody =
      $("#emptyPlacement")?.parentElement ||
      document
        .querySelector("#placementSearch")
        ?.closest("div.mt-8")
        ?.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = rows.length
      ? rows
          .map((p) => {
            return `
      <tr class="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition" data-level="${p.level_assigned ? `level ${p.level_assigned}` : ""}" data-placement-candidate="true" data-status="${escapeHtml(professionalLevelInfo(p.level_assigned))}">
        <td class="px-6 py-5 align-middle">
          <div>
            <p class="font-medium text-slate-900">${escapeHtml(p.full_name)}</p>
            <p class="text-xs text-slate-500">${escapeHtml(p.email || "")}</p>
          </div>
        </td>
        <td class="px-6 py-5 align-middle">
          ${p.level_assigned ? badge(`Level ${p.level_assigned}`, "blue") : "—"}
        </td>
        <td class="px-6 py-5 align-middle font-medium text-slate-700">
          ${p.percentage !== null ? `${p.percentage}%` : '—'}
        </td>
        <td class="px-6 py-5 align-middle text-slate-500">
          ${escapeHtml(p.company_name || "—")}
        </td>
        <td class="px-6 py-5 align-middle">
          <button class="view-placement-btn rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:border-intern-blue hover:text-intern-blue transition" type="button" data-id="${Number(p.id)}" data-name="${escapeHtml(p.full_name)}" data-level="${escapeHtml(p.level_assigned || "")}" data-status="${escapeHtml(p.placement_status)}" data-company="${escapeHtml(p.company_name || "")}" data-notes="${escapeHtml(p.notes || "")}">Edit</button>
        </td>
      </tr>`;
          })
          .join("")
      : `<tr id="emptyPlacement"><td class="px-6 py-12 text-center text-sm text-slate-600" colspan="5">No candidates found</td></tr>`;
    refreshIcons();

    $$(".view-placement-btn").forEach(
      (btn) => (btn.onclick = () => openPlacementEditor(btn)),
    );
    wirePlacementFilters();
    // Also load Job Descriptions section
    await loadJobs();
  }


  function openPlacementEditor(btn) {
    const root = modal(
      "Update Placement",
      `
      <form id="placementEditForm" class="space-y-4">
        <div><p class="text-sm font-medium text-slate-800">${escapeHtml(btn.dataset.name)}</p></div>
        <div class="rounded-lg bg-slate-50 p-3">
          <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Professional Status</p>
          <div class="mt-2">${badge(professionalLevelInfo(btn.dataset.level), "blue")}</div>
        </div>
        <label class="block text-sm text-slate-600">Placement Workflow Status
          <select id="placementWorkflowStatusEdit" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2">
            ${["eligible", "shortlisted", "interviewing", "placed", "not_placed"].map((x) => `<option value="${x}" ${x === btn.dataset.status ? "selected" : ""}>${label(x)}</option>`).join("")}
          </select>
        </label>
        <label class="block text-sm text-slate-600">Company
          <input id="placementCompanyEdit" class="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2" value="${escapeHtml(btn.dataset.company || "")}">
        </label>
        <label class="block text-sm text-slate-600">Notes
          <textarea id="placementNotesEdit" class="mt-1 min-h-24 w-full rounded-lg border border-slate-200 px-3 py-2">${escapeHtml(btn.dataset.notes || "")}</textarea>
        </label>
        <button class="w-full rounded-lg bg-intern-blue px-4 py-2.5 text-sm font-medium text-white">Save</button>
      </form>`,
    );
    $("#placementEditForm", root).onsubmit = async (e) => {
      e.preventDefault();
      try {
        await api("placement", {
          method: "POST",
          body: {
            id: Number(btn.dataset.id),
            status: $("#placementWorkflowStatusEdit", root).value,
            company_name: $("#placementCompanyEdit", root).value,
            notes: $("#placementNotesEdit", root).value,
          },
        });
        root.remove();
        notify("Placement updated.");
        await loadPlacements();
      } catch (err) {
        notify(err.message, true);
      }
    };
  }

  function wirePlacementFilters() {
    const search = $("#placementSearch"),
      level = $("#placementLevelFilter"),
      exportBtn = $("#exportPlacementCsvBtn"),
      tbody = document
        .querySelector("#placementSearch")
        ?.closest("div.mt-8")
        ?.querySelector("tbody");
    if (!tbody) return;
    const run = () => {
      const q = (search?.value || "").toLowerCase(),
        l = (level?.value || "").toLowerCase();
      tbody
        .querySelectorAll("tr[data-placement-candidate]")
        .forEach((row) => {
          row.style.display =
            row.textContent.toLowerCase().includes(q) &&
            sameFilterValue(row.dataset.level, l)
              ? ""
              : "none";
        });
    };
    [search, level].forEach((el) => el?.addEventListener("input", run));
    level?.addEventListener("change", run);

    if (exportBtn && !exportBtn.dataset.bound) {
      exportBtn.dataset.bound = "1";
      exportBtn.onclick = () => exportPlacementCsv();
    }
  }

  async function loadSettings() {
    const data = await api("settings"),
      profile = data.profile,
      settings = data.settings || [];
    const get = (k) => settings.find((s) => s.setting_key === k)?.setting_value;
    if (profile) {
      if ($("#fullName")) $("#fullName").value = profile.full_name || "Admin";
      if ($("#email")) $("#email").value = profile.email || "";
      if ($("#phone")) $("#phone").value = profile.phone || "";
      if ($("#adminHeaderName"))
        $("#adminHeaderName").textContent = profile.full_name || "Admin";
    }
    [
      "batchNotifications",
      "assessmentNotifications",
      "placementNotifications",
      "certificateNotifications",
    ].forEach((id) => {
      const key = id.replace("Notifications", "_notifications");
      const el = $("#" + id);
      if (el && get(key) !== undefined) el.checked = get(key) === "1";
    });
    const refresh = $("#refreshPreference");
    if (refresh && get("refresh_preference"))
      refresh.value = get("refresh_preference");

    const save = $("#saveChangesButton");
    if (save && !save.dataset.bound) {
      save.dataset.bound = "1";
      save.onclick = async () => {
        try {
          await api("profile", {
            method: "POST",
            body: {
              full_name: $("#fullName").value,
              email: $("#email").value,
              phone: $("#phone").value,
            },
          });
          notify("Profile saved.");
        } catch (e) {
          notify(e.message, true);
        }
      };
    }

    const prefs = $("#savePreferences");
    if (prefs && !prefs.dataset.bound) {
      prefs.dataset.bound = "1";
      prefs.onclick = async () => {
        try {
          for (const id of [
            "batchNotifications",
            "assessmentNotifications",
            "placementNotifications",
            "certificateNotifications",
          ]) {
            await api("setting", {
              method: "POST",
              body: {
                key: id.replace("Notifications", "_notifications"),
                value: $("#" + id).checked ? "1" : "0",
              },
            });
          }
          await api("setting", {
            method: "POST",
            body: {
              key: "refresh_preference",
              value: $("#refreshPreference").value,
            },
          });
          notify("Preferences saved.");
        } catch (e) {
          notify(e.message, true);
        }
      };
    }
  }

  function bindGenerateButtons() {
    
    const aBtn = $("#addQuestionButton");
    if (aBtn && !aBtn.dataset.bound) {
      aBtn.dataset.bound = "1";
      aBtn.onclick = async () => {
        try {
          const res = await api("question-banks");
          const banks = res.question_banks || [];
          
          let bankOptions = banks.map(b => `<option value="${b.id}">${escapeHtml(b.name)} (${escapeHtml(b.assessment_title)})</option>`).join('');
          if (!bankOptions) bankOptions = '<option value="">No Question Banks available</option>';

          const html = `
            <form id="addQuestionForm" class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Question Bank</label>
                <select id="qf_bank" class="w-full rounded-lg border-slate-300 p-2.5 text-sm outline-none focus:border-intern-blue focus:ring-1 focus:ring-intern-blue">${bankOptions}</select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Question Text <span class="text-red-500">*</span></label>
                <textarea id="qf_text" rows="3" class="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-intern-blue focus:ring-1 focus:ring-intern-blue" required></textarea>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Difficulty</label>
                <select id="qf_diff" class="w-full rounded-lg border-slate-300 p-2.5 text-sm outline-none focus:border-intern-blue focus:ring-1 focus:ring-intern-blue">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              
              <div class="space-y-3">
                <label class="block text-sm font-medium text-slate-700">Options <span class="text-red-500">*</span></label>
                ${[1, 2, 3, 4].map(i => `
                  <div class="flex items-center gap-3">
                    <input type="radio" name="qf_correct" value="${i}" class="h-4 w-4 text-intern-blue focus:ring-intern-blue" ${i===1 ? 'checked' : ''}>
                    <input type="text" id="qf_opt${i}" class="w-full rounded-lg border border-slate-300 p-2 text-sm outline-none focus:border-intern-blue focus:ring-1 focus:ring-intern-blue" placeholder="Option ${i}" required>
                  </div>
                `).join('')}
              </div>

              <div class="flex items-center gap-2 mt-4">
                <input type="checkbox" id="qf_publish" class="rounded border-slate-300 text-intern-blue focus:ring-intern-blue" checked>
                <label for="qf_publish" class="text-sm text-slate-700">Publish immediately (approved)</label>
              </div>

              <div id="qf_error" class="hidden text-sm text-red-600 font-medium"></div>

              <div class="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button type="button" onclick="document.getElementById('m7Modal').remove()" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" class="rounded-lg bg-intern-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition">Save Question</button>
              </div>
            </form>
          `;

          modal("Add New Question", html);

          const form = $("#addQuestionForm");
          form.onsubmit = async (e) => {
            e.preventDefault();
            const errBox = $("#qf_error");
            errBox.classList.add("hidden");

            const qbankId = $("#qf_bank").value;
            const qtext = $("#qf_text").value.trim();
            if (!qbankId || !qtext) {
              errBox.textContent = "Question text and bank are required.";
              errBox.classList.remove("hidden");
              return;
            }

            const options = [];
            const correctVal = document.querySelector('input[name="qf_correct"]:checked')?.value;
            for (let i = 1; i <= 4; i++) {
              const optText = $(`#qf_opt${i}`).value.trim();
              if (!optText) {
                errBox.textContent = `Option ${i} is required.`;
                errBox.classList.remove("hidden");
                return;
              }
              options.push({ option_text: optText, is_correct: (correctVal == i ? 1 : 0) });
            }

            const payload = {
              question_bank_id: parseInt(qbankId),
              question_text: qtext,
              difficulty: $("#qf_diff").value,
              approval_status: $("#qf_publish").checked ? "approved" : "pending",
              options: options
            };

            try {
              await apiQbank("add_question", { method: "POST", body: payload });
              notify("Question added.");
              $("#m7Modal").remove();
              await loadQuestions();
            } catch (err) {
              notify(err.message, true);
            }
          };

        } catch (e) {
          notify(e.message, true);
        }
      };
    }

    const aiBtn = $("#generateAiQuestionsButton");
    if (aiBtn && !aiBtn.dataset.bound) {
      aiBtn.dataset.bound = "1";
      aiBtn.onclick = async () => {
        try {
          const qbanksData = await api("question-banks");
          const qbanks = qbanksData.question_banks || [];
          if (!qbanks.length) {
            notify("No question banks available.", true);
            return;
          }

          const qbankOptions = qbanks.map(b => `<option value="${b.id}">${escapeHtml(b.name)} (${escapeHtml(b.assessment_title || 'General')})</option>`).join('');

          const html = `
            <form id="generateAiForm" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Question Bank <span class="text-red-500">*</span></label>
                <select id="aif_bank" class="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600" required>
                  <option value="">Select Question Bank</option>
                  ${qbankOptions}
                </select>
              </div>

              <div class="border-t border-b border-slate-100 py-3 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold uppercase tracking-wider text-slate-600">Select Topics & Question Breakdown</span>
                  <span id="aif_total_badge" class="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 shadow-sm">Total: 100 questions</span>
                </div>

                <!-- 1. Aptitude -->
                <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition hover:border-purple-300">
                  <div class="flex items-center justify-between gap-3">
                    <label class="flex items-center gap-2 cursor-pointer font-semibold text-sm text-slate-800 select-none">
                      <input type="checkbox" id="aif_enable_aptitude" checked class="h-4 w-4 rounded text-purple-600 focus:ring-purple-500">
                      <span>🧠 Aptitude</span>
                      <span class="text-xs font-normal text-slate-500">(Quant, Logical & Verbal)</span>
                    </label>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <label class="text-xs text-slate-500 font-medium">Questions:</label>
                      <input type="number" id="aif_count_aptitude" min="0" max="100" value="30" class="w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-center font-bold text-slate-800 outline-none focus:border-purple-600">
                    </div>
                  </div>
                  <div class="mt-2.5" id="aif_sub_aptitude_wrap">
                    <input type="text" id="aif_topic_aptitude" class="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-purple-500" placeholder="Focus: e.g. Quantitative Aptitude, Logical Reasoning, Number Series, Data Interpretation" value="Quantitative Aptitude, Logical Reasoning, Data Interpretation">
                  </div>
                </div>

                <!-- 2. DSA -->
                <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition hover:border-purple-300">
                  <div class="flex items-center justify-between gap-3">
                    <label class="flex items-center gap-2 cursor-pointer font-semibold text-sm text-slate-800 select-none">
                      <input type="checkbox" id="aif_enable_dsa" checked class="h-4 w-4 rounded text-purple-600 focus:ring-purple-500">
                      <span>⚡ Data Structures & Algorithms (DSA)</span>
                    </label>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <label class="text-xs text-slate-500 font-medium">Questions:</label>
                      <input type="number" id="aif_count_dsa" min="0" max="100" value="35" class="w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-center font-bold text-slate-800 outline-none focus:border-purple-600">
                    </div>
                  </div>
                  <div class="mt-2.5" id="aif_sub_dsa_wrap">
                    <input type="text" id="aif_topic_dsa" class="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-purple-500" placeholder="Focus: e.g. Arrays, Strings, Trees, Linked Lists, Sorting, Binary Search, DP" value="Arrays, Strings, Trees, Linked Lists, Sorting, Binary Search">
                  </div>
                </div>

                <!-- 3. Core Domain Knowledge -->
                <div class="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 transition hover:border-purple-300">
                  <div class="flex items-center justify-between gap-3">
                    <label class="flex items-center gap-2 cursor-pointer font-semibold text-sm text-slate-800 select-none">
                      <input type="checkbox" id="aif_enable_core" checked class="h-4 w-4 rounded text-purple-600 focus:ring-purple-500">
                      <span>💻 Core Domain Knowledge</span>
                    </label>
                    <div class="flex items-center gap-1.5 shrink-0">
                      <label class="text-xs text-slate-500 font-medium">Questions:</label>
                      <input type="number" id="aif_count_core" min="0" max="100" value="35" class="w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-center font-bold text-slate-800 outline-none focus:border-purple-600">
                    </div>
                  </div>
                  <div class="mt-2.5" id="aif_sub_core_wrap">
                    <input type="text" id="aif_topic_core" class="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 placeholder-slate-400 outline-none focus:border-purple-500" placeholder="Focus: e.g. Core Programming, OOPs, DBMS & SQL, Web Architecture, OS" value="Core Programming, OOPs, DBMS & SQL, Web Architecture">
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Question Style (Optional)</label>
                <input type="text" id="aif_type" class="w-full rounded-lg border border-slate-300 p-2.5 text-sm outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600" placeholder="e.g. Conceptual, Code Snippet, Problem-Solving, Scenario-based" value="Conceptual and Code Snippet based">
              </div>

              <div>
                <label class="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Difficulty Distribution</label>
                <div class="grid grid-cols-3 gap-3">
                  <div>
                    <label class="block text-xs text-slate-500 mb-1">Easy</label>
                    <input type="number" id="aif_easy" min="0" value="35" class="w-full rounded-lg border border-slate-300 p-2 text-sm text-center outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600">
                  </div>
                  <div>
                    <label class="block text-xs text-slate-500 mb-1">Medium</label>
                    <input type="number" id="aif_medium" min="0" value="45" class="w-full rounded-lg border border-slate-300 p-2 text-sm text-center outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600">
                  </div>
                  <div>
                    <label class="block text-xs text-slate-500 mb-1">Hard</label>
                    <input type="number" id="aif_hard" min="0" value="20" class="w-full rounded-lg border border-slate-300 p-2 text-sm text-center outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600">
                  </div>
                </div>
              </div>

              <p class="text-xs text-slate-500">AI-generated questions will be inserted with <span class="font-semibold text-amber-600">Pending</span> status and must be approved before appearing in exams.</p>

              <div id="aif_error" class="hidden text-sm text-red-600 font-medium"></div>

              <div class="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button type="button" onclick="document.getElementById('m7Modal').remove()" class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition">Cancel</button>
                <button type="submit" id="aif_submit" class="rounded-lg bg-purple-600 px-5 py-2 text-sm font-medium text-white hover:bg-purple-700 transition flex items-center gap-2">
                  <i class="ri-sparkling-fill"></i> Generate Questions
                </button>
              </div>
            </form>
          `;

          modal("Generate Questions with AI", html);

          api("ai-status").then(res => {
            if (res && res.data && !res.data.configured) {
              const banner = document.createElement("div");
              banner.className = "mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 font-medium border border-amber-200";
              banner.innerHTML = "AI Provider: Not Configured";
              $("#generateAiForm").prepend(banner);
            }
          }).catch(console.error);

          const form = $("#generateAiForm");

          // Interactive helpers for dynamic counts & difficulty distribution
          const calcTotals = () => {
            const aptEnabled = $("#aif_enable_aptitude")?.checked;
            const dsaEnabled = $("#aif_enable_dsa")?.checked;
            const coreEnabled = $("#aif_enable_core")?.checked;

            const aptCount = aptEnabled ? (parseInt($("#aif_count_aptitude")?.value, 10) || 0) : 0;
            const dsaCount = dsaEnabled ? (parseInt($("#aif_count_dsa")?.value, 10) || 0) : 0;
            const coreCount = coreEnabled ? (parseInt($("#aif_count_core")?.value, 10) || 0) : 0;

            const total = aptCount + dsaCount + coreCount;
            const badge = $("#aif_total_badge");
            if (badge) {
              badge.textContent = `Total: ${total} questions`;
            }

            // Distribute difficulty dynamically if total > 0
            if (total > 0) {
              const easy = Math.round(total * 0.35);
              const hard = Math.max(1, Math.round(total * 0.20));
              const medium = Math.max(0, total - easy - hard);
              const easyInput = $("#aif_easy");
              const medInput = $("#aif_medium");
              const hardInput = $("#aif_hard");
              if (easyInput && !easyInput.dataset.manual) easyInput.value = easy;
              if (medInput && !medInput.dataset.manual) medInput.value = medium;
              if (hardInput && !hardInput.dataset.manual) hardInput.value = hard;
            }
          };

          const setupSection = (chkId, countId, wrapId) => {
            const chk = $(`#${chkId}`);
            const cnt = $(`#${countId}`);
            const wrap = $(`#${wrapId}`);
            if (!chk || !cnt) return;
            chk.addEventListener("change", () => {
              cnt.disabled = !chk.checked;
              if (wrap) wrap.style.opacity = chk.checked ? "1" : "0.4";
              if (!chk.checked) {
                cnt.dataset.prev = cnt.value;
                cnt.value = "0";
              } else {
                cnt.value = cnt.dataset.prev || (chkId === "aif_enable_aptitude" ? "30" : "35");
              }
              calcTotals();
            });
            cnt.addEventListener("input", calcTotals);
          };

          setupSection("aif_enable_aptitude", "aif_count_aptitude", "aif_sub_aptitude_wrap");
          setupSection("aif_enable_dsa", "aif_count_dsa", "aif_sub_dsa_wrap");
          setupSection("aif_enable_core", "aif_count_core", "aif_sub_core_wrap");

          ["#aif_easy", "#aif_medium", "#aif_hard"].forEach(id => {
            const el = $(id);
            if (el) {
              el.addEventListener("input", () => { el.dataset.manual = "1"; });
            }
          });

          calcTotals();

          form.onsubmit = async (e) => {
            e.preventDefault();
            const errBox = $("#aif_error");
            const submitBtn = $("#aif_submit");
            errBox.classList.add("hidden");

            const qbankId = $("#aif_bank").value;
            const aptEnabled = $("#aif_enable_aptitude")?.checked;
            const dsaEnabled = $("#aif_enable_dsa")?.checked;
            const coreEnabled = $("#aif_enable_core")?.checked;

            const aptCount = aptEnabled ? (parseInt($("#aif_count_aptitude")?.value, 10) || 0) : 0;
            const dsaCount = dsaEnabled ? (parseInt($("#aif_count_dsa")?.value, 10) || 0) : 0;
            const coreCount = coreEnabled ? (parseInt($("#aif_count_core")?.value, 10) || 0) : 0;

            const aptTopic = $("#aif_topic_aptitude")?.value.trim() || "";
            const dsaTopic = $("#aif_topic_dsa")?.value.trim() || "";
            const coreTopic = $("#aif_topic_core")?.value.trim() || "";

            const qType = $("#aif_type").value.trim();
            const totalCount = aptCount + dsaCount + coreCount;

            const easyCount = parseInt($("#aif_easy").value, 10) || 0;
            const mediumCount = parseInt($("#aif_medium").value, 10) || 0;
            const hardCount = parseInt($("#aif_hard").value, 10) || 0;

            if (!qbankId) {
              errBox.textContent = "Please select a Question Bank.";
              errBox.classList.remove("hidden");
              return;
            }

            if (totalCount <= 0) {
              errBox.textContent = "Please select at least one topic and specify at least 1 question.";
              errBox.classList.remove("hidden");
              return;
            }

            if (totalCount > 100) {
              errBox.textContent = "Maximum 100 questions can be generated per request.";
              errBox.classList.remove("hidden");
              return;
            }

            const sections = [];
            if (aptEnabled && aptCount > 0) {
              sections.push(`${aptCount} Aptitude questions (focusing on: ${aptTopic || 'Quantitative, Logical & Verbal Reasoning'})`);
            }
            if (dsaEnabled && dsaCount > 0) {
              sections.push(`${dsaCount} Data Structures & Algorithms (DSA) questions (focusing on: ${dsaTopic || 'Arrays, Strings, Trees, Linked Lists, Sorting, Binary Search'})`);
            }
            if (coreEnabled && coreCount > 0) {
              sections.push(`${coreCount} Core Domain Knowledge questions (focusing on: ${coreTopic || 'Core Programming, OOPs, DBMS/SQL, Web Architecture'})`);
            }

            const combinedTopic = `Section Distribution:\n` + sections.map(s => `- ${s}`).join('\n') + (qType ? `\nQuestion Style: ${qType}` : '');

            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="ri-loader-4-line animate-spin"></i> Generating ${totalCount} Questions...`;

            try {
              const res = await apiQbank("generate_questions", {
                method: "POST",
                body: {
                  question_bank_id: parseInt(qbankId, 10),
                  topic: combinedTopic,
                  count: totalCount,
                  question_type: qType,
                  easy_count: easyCount,
                  medium_count: mediumCount,
                  hard_count: hardCount
                }
              });

              notify(`Successfully generated ${res.inserted || totalCount} question(s) across selected topics!`);
              $("#m7Modal").remove();
              await loadQuestions();
            } catch (err) {
              errBox.textContent = err.message || "AI generation failed.";
              errBox.classList.remove("hidden");
              submitBtn.disabled = false;
              submitBtn.innerHTML = `<i class="ri-sparkling-fill"></i> Generate Questions`;
            }
          };
        } catch (e) {
          notify(e.message, true);
        }
      };
    }

    const qBtn = $("#generateQuestionsButton");
    if (qBtn && !qBtn.dataset.bound) {
      qBtn.dataset.bound = "1";
      qBtn.onclick = async () => {
        try {
          const data = await api("questions");
          notify(
            `Question bank refreshed: ${(data.questions || []).length} questions. AI generation remains owned by M1.`,
          );
          await loadQuestions();
        } catch (e) {
          notify(e.message, true);
        }
      };
    }

    const cBtn = $("#generateCertificateButton");
    if (cBtn && !cBtn.dataset.bound) {
      cBtn.dataset.bound = "1";
      cBtn.onclick = async () => {
        if (!confirm("Generate missing certificates for all eligible candidates?")) return;
        
        cBtn.textContent = "Generating...";
        cBtn.disabled = true;
        
        try {
          const data = await api("certificate-bulk", {
            method: "POST",
            body: {},
          });
          notify(`Successfully generated ${data.count} certificates.`);
          await loadCertificates();
        } catch (e) {
          notify(e.message, true);
        } finally {
          cBtn.textContent = "Generate Certificate";
          cBtn.disabled = false;
        }
      };
    }
    
    const autoGenBtn = $("#autoGenStatusButton");
    if (autoGenBtn && !autoGenBtn.dataset.bound) {
      autoGenBtn.dataset.bound = "1";
      autoGenBtn.onclick = async () => {
        try {
          // Add loading state
          const originalHTML = autoGenBtn.innerHTML;
          autoGenBtn.innerHTML = `<i class="ri-loader-4-line animate-spin h-4 w-4"></i> Loading...`;
          autoGenBtn.disabled = true;

          const res = await apiQbank("auto_generate?action=status");
          
          let upcomingHtml = '';
          if (res.upcoming_exams && res.upcoming_exams.length > 0) {
            upcomingHtml = res.upcoming_exams.map(e => `
              <div class="mb-3 p-3 rounded-lg border border-slate-200 bg-slate-50 flex flex-col gap-1 text-sm">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-slate-800">${escapeHtml(e.assessment_title)}</span>
                  <span class="text-xs font-medium text-slate-500">${escapeHtml(e.exam_date)} ${escapeHtml(e.start_time.slice(0,5))}</span>
                </div>
                <div class="flex justify-between items-center mt-1">
                  <span class="text-xs text-slate-600">Requires: ${e.total_questions} Qs | Approved: <span class="${e.approved_count >= e.total_questions ? 'text-green-600 font-bold' : 'text-amber-600 font-bold'}">${e.approved_count}</span></span>
                  ${e.already_generated > 0 ? `<span class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">Auto-Generated</span>` : (e.approved_count >= e.total_questions ? `<span class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Ready</span>` : `<span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Waiting for trigger</span>`)}
                </div>
              </div>
            `).join('');
          } else {
            upcomingHtml = `<div class="p-4 text-center text-sm text-slate-500 border border-slate-200 rounded-lg">No upcoming exams scheduled.</div>`;
          }

          let logsHtml = '';
          if (res.logs && res.logs.length > 0) {
            logsHtml = res.logs.map(l => `
              <div class="mb-2 p-3 rounded-lg border ${l.status === 'completed' ? 'border-green-200 bg-green-50/50' : (l.status === 'failed' ? 'border-red-200 bg-red-50/50' : 'border-slate-200 bg-slate-50')} flex flex-col gap-1 text-sm">
                <div class="flex justify-between items-center">
                  <span class="font-bold text-slate-800">${escapeHtml(l.assessment_title || 'Unknown Assessment')}</span>
                  <span class="text-xs font-medium text-slate-500">${escapeHtml(l.created_at)}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-xs text-slate-600">${escapeHtml(l.details)}</span>
                  <span class="text-xs font-bold ${l.status === 'completed' ? 'text-green-600' : (l.status === 'failed' ? 'text-red-600' : 'text-slate-600')}">${escapeHtml(l.status.toUpperCase())}</span>
                </div>
              </div>
            `).join('');
          } else {
            logsHtml = `<div class="p-4 text-center text-sm text-slate-500 border border-slate-200 rounded-lg">No generation logs found.</div>`;
          }

          const html = `
            <div class="p-6 space-y-6">
              <!-- Header Stats -->
              <div class="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex justify-between items-center">
                <div>
                  <h4 class="font-semibold text-indigo-900 flex items-center gap-2"><i data-lucide="bot" class="h-5 w-5"></i> Auto-Generation Engine</h4>
                  <p class="text-xs text-indigo-700 mt-1">Automatically generates test questions 1.5 hours before an exam starts if the pool is insufficient.</p>
                </div>
                <div class="text-right">
                  <div class="text-xs text-indigo-700 font-medium">Server Time</div>
                  <div class="text-sm font-bold text-indigo-900 font-mono">${escapeHtml(res.server_time)}</div>
                </div>
              </div>

              <!-- Content Grid -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Left: Upcoming Exams -->
                <div>
                  <div class="flex justify-between items-end mb-3">
                    <h5 class="font-semibold text-slate-800 text-sm">Upcoming Exams</h5>
                    <span class="text-xs text-slate-500">Auto-triggers for exams within 90 mins</span>
                  </div>
                  <div class="max-h-64 overflow-y-auto pr-1">
                    ${upcomingHtml}
                  </div>
                  <button id="triggerAutoGenBtn" class="mt-4 w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-sm">
                    <i data-lucide="zap" class="h-4 w-4"></i> Trigger Auto-Generation Now
                  </button>
                  <p class="text-[10px] text-slate-400 text-center mt-2 leading-tight">Clicking this will forcefully run the background cron script and generate questions for any upcoming exam in the next 1.5 hours that doesn't have enough questions.</p>
                </div>

                <!-- Right: Logs -->
                <div>
                  <h5 class="font-semibold text-slate-800 text-sm mb-3">Recent Generation Logs</h5>
                  <div class="max-h-80 overflow-y-auto pr-1">
                    ${logsHtml}
                  </div>
                </div>
              </div>
            </div>
          `;

          modal("Auto-Generation Status", html);
          if (typeof lucide !== 'undefined') lucide.createIcons();

          const triggerBtn = $("#triggerAutoGenBtn");
          if (triggerBtn) {
            triggerBtn.onclick = async () => {
              triggerBtn.disabled = true;
              triggerBtn.innerHTML = `<i class="ri-loader-4-line animate-spin h-4 w-4"></i> Generating Questions...`;
              try {
                const triggerRes = await apiQbank("auto_generate", { method: "POST" });
                notify("Auto-generation triggered successfully!");
                $("#m7Modal").remove();
                await loadQuestions();
              } catch (err) {
                notify("Auto-generation failed: " + err.message, true);
                triggerBtn.disabled = false;
                triggerBtn.innerHTML = `<i data-lucide="zap" class="h-4 w-4"></i> Trigger Auto-Generation Now`;
                if (typeof lucide !== 'undefined') lucide.createIcons();
              }
            };
          }
          
        } catch (e) {
          notify(e.message, true);
        } finally {
          autoGenBtn.innerHTML = `<i data-lucide="bot" class="h-4 w-4"></i> Auto-Gen Status`;
          autoGenBtn.disabled = false;
          if (typeof lucide !== 'undefined') lucide.createIcons();
        }
      };
    }
  }



  async function initPage() {
    initCommon();
    bindGenerateButtons();
    bindAddCandidateButton();
    const path = window.location.pathname.toLowerCase();
    try {
      if (path.endsWith("index.html") || path.endsWith("/admin/"))
        await loadDashboard();
      else if (path.endsWith("candidates.html")) await loadCandidates();
      else if (path.endsWith("results.html")) await loadResults();
      else if (path.endsWith("certificates.html")) await loadCertificates();
      else if (path.endsWith("questions.html")) await loadQuestions();
      else if (path.endsWith("batches.html")) await loadBatches();
      else if (path.endsWith("placement.html")) await loadPlacements();
      else if (path.endsWith("setting.html")) await loadSettings();
    } catch (e) {
      console.error(e);
      notify(e.message || "Unable to load data.", true);
    }

    const refresh = $("#refreshDashboard");
    if (refresh && !refresh.dataset.bound) {
      refresh.dataset.bound = "1";
      refresh.onclick = async () => {
        refresh.classList.add("animate-spin");
        try {
          await loadDashboard();
          notify("Dashboard refreshed.");
        } catch (e) {
          notify(e.message, true);
        } finally {
          setTimeout(() => refresh.classList.remove("animate-spin"), 700);
        }
      };
    }

    if (typeof lucide !== "undefined") lucide.createIcons();
  }

  document.addEventListener("DOMContentLoaded", initPage);
})();
