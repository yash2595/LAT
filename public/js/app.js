// M4 Dashboard - Railway MySQL API Integration
// Values available from the API are dynamic. Static descriptive UI text remains in dashboard.html.

function initStudentResponsiveShell() {
    const sidebar = document.querySelector("body > div aside");
    const main = document.querySelector("body > div main");
    const header = main?.querySelector("header");

    if (!sidebar || !main || !header || sidebar.dataset.responsiveShellBound) return;
    sidebar.dataset.responsiveShellBound = "1";

    document.body.classList.add("overflow-x-hidden");
    sidebar.classList.remove("hidden", "md:flex");
    sidebar.classList.add("student-responsive-sidebar");
    main.classList.add("student-responsive-main");
    header.classList.remove("left-[250px]");
    header.classList.add("student-responsive-header");
    main.querySelectorAll("table").forEach((table) => {
        table.classList.add("min-w-[640px]");
        table.parentElement?.classList.add("max-w-full", "overflow-x-auto");
    });

    const menuButton = document.createElement("button");
    menuButton.type = "button";
    menuButton.className = "student-nav-toggle";
    menuButton.setAttribute("aria-label", "Open navigation");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-controls", sidebar.id || "student-sidebar");
    menuButton.innerHTML = '<i data-lucide="menu" class="h-5 w-5"></i>';
    if (!sidebar.id) sidebar.id = "student-sidebar";

    const headerTitle = header.firstElementChild;
    if (headerTitle) {
        headerTitle.classList.add("min-w-0");
        headerTitle.prepend(menuButton);
        if (menuButton.nextElementSibling?.tagName === "DIV") {
            menuButton.nextElementSibling.classList.add("student-header-icon");
        }
    }

    const overlay = document.createElement("button");
    overlay.type = "button";
    overlay.className = "student-nav-overlay";
    overlay.setAttribute("aria-label", "Close navigation");
    document.body.appendChild(overlay);

    const close = () => {
        sidebar.classList.remove("is-open");
        overlay.classList.remove("is-visible");
        document.body.classList.remove("student-nav-open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open navigation");
    };
    const open = () => {
        sidebar.classList.add("is-open");
        overlay.classList.add("is-visible");
        document.body.classList.add("student-nav-open");
        menuButton.setAttribute("aria-expanded", "true");
        menuButton.setAttribute("aria-label", "Close navigation");
    };

    menuButton.addEventListener("click", () => {
        if (!sidebar.classList.contains("is-open")) open();
        else close();
    });
    overlay.addEventListener("click", close);
    sidebar.querySelectorAll("a").forEach((link) => link.addEventListener("click", close));
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") close();
    });
    window.addEventListener("resize", () => {
        if (window.innerWidth >= 1024) close();
    });

    if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    initStudentResponsiveShell();
    try {
        const response = await fetch("api/dashboard.php", {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        if (response.status === 401) {
            handleUnauthenticated("Session expired or authentication required. Please <a href='login.php' style='color:#1652d6;text-decoration:underline;font-weight:700;'>log in as candidate</a> to access your dashboard.");
            return;
        }

        const payload = await response.json();

        const isSuccess = payload.status === "success";
        if (!response.ok || !isSuccess || !payload.data) {
            throw new Error(payload.message || "Unable to load dashboard data.");
        }

        const source = payload.data;

        fillSection("candidate", source.candidate);
        fillSection("payment", source.payment);
        fillSection("enrollment", source.enrollment);
        fillSection("batch", source.batch);
        fillSection("exam", source.exam);
        fillSection("result", source.result);
        fillSection("certificate", source.certificate);
        fillSection("placement", source.placement);

        updateStudentAvatars(source.candidate?.name, source.candidate?.profile_details?.photo_file);
        updateStatusCards(source);
        updateLearningJourney(source);
        document.body.dataset.authState = "ready";
        document.dispatchEvent(new Event("student:journey-refresh"));
        renderCertificateState(source);
        renderProfileState(source);
        renderEnrollmentState(source);
        renderResultState(source);
        let userLevel = source.candidate?.level || 0;
        if (typeof userLevel === "string") {
            const match = userLevel.match(/\d+/);
            userLevel = match ? parseInt(match[0], 10) : 0;
        }
        LevelCard.update({ level: userLevel });
    } catch (error) {
        document.body.dataset.authState = "error";
        document.dispatchEvent(new Event("student:journey-refresh"));
        console.error("Dashboard API Error:", error);

        const errorBox = document.querySelector("[data-api-error]");
        if (errorBox) {
            errorBox.textContent = "Unable to load dashboard data. Please try again.";
            errorBox.style.display = "block";
        } else {
            console.error("Critical Dashboard API Error: " + error.message);
        }
    }
});

document.addEventListener("DOMContentLoaded", () => {
    if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
    }
});

function handleUnauthenticated(message) {
    document.body.dataset.authState = "unauthenticated";
    document.dispatchEvent(new Event("student:journey-refresh"));
    updateStudentAvatars("—");
    document.querySelectorAll('[data-candidate="name"]').forEach((el) => {
        el.textContent = "Unauthenticated";
    });

    let alertBox = document.getElementById("dashboard-alert");
    if (!alertBox) {
        const content = document.querySelector(".content");
        if (content) {
            alertBox = document.createElement("div");
            alertBox.id = "dashboard-alert";
            alertBox.style.cssText = "margin-bottom: 20px; padding: 14px 18px; border: 1px solid #ef4444; background: #fef2f2; color: #991b1b; border-radius: 8px; font-size: 14px; line-height: 1.5;";
            content.insertBefore(alertBox, content.firstChild);
        }
    }
    if (alertBox) {
        alertBox.innerHTML = message || "Session expired or authentication required. Please <a href='login.php' style='color:#1652d6;text-decoration:underline;font-weight:700;'>log in as candidate</a> to access your dashboard.";
        alertBox.style.display = "block";
    }
}

function fillSection(attribute, data) {
    if (!data) return;

    document.querySelectorAll(`[data-${attribute}]`).forEach((el) => {
        const key = el.dataset[attribute];

        if (data[key] !== undefined && data[key] !== null) {
            el.textContent = data[key];
        }
    });
}

function updateStudentAvatars(name, photoFile = "") {
    const avatars = document.querySelectorAll('[data-candidate="initials"]');
    if (!avatars.length) return;

    const initials = name && name !== "—"
        ? name
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0].toUpperCase())
            .join("")
        : "--";

    avatars.forEach((initialsElement) => {
        if (initialsElement.id === "profile-photo-placeholder") return;

        let avatar = initialsElement.tagName === "SPAN"
            ? initialsElement.parentElement
            : initialsElement;
        if (!avatar) return;

        if (initialsElement === avatar) {
            const initialsLabel = document.createElement("span");
            initialsLabel.dataset.candidate = "initials";
            initialsLabel.textContent = initialsElement.textContent.trim() || initials;
            initialsElement.removeAttribute("data-candidate");
            initialsElement.prepend(initialsLabel);
            avatar = initialsElement;
        }

        const initialsLabel = avatar.querySelector(':scope > [data-candidate="initials"]');
        if (!initialsLabel) return;
        if (initialsLabel.textContent !== initials) {
            initialsLabel.textContent = initials;
        }

        avatar.classList.add("student-avatar");
        let image = avatar.querySelector(":scope > .student-avatar-photo");
        if (!image) {
            image = document.createElement("img");
            image.className = "student-avatar-photo";
            image.alt = "";
            image.setAttribute("aria-hidden", "true");
            avatar.append(image);
        }

        if (!photoFile) {
            image.removeAttribute("src");
            image.classList.remove("is-loaded");
            avatar.classList.remove("has-student-photo");
            return;
        }

        image.onload = () => {
            image.classList.add("is-loaded");
            avatar.classList.add("has-student-photo");
        };
        image.onerror = () => {
            image.classList.remove("is-loaded");
            avatar.classList.remove("has-student-photo");
        };
        image.src = "api/profile_file.php?type=photo&t=" + Date.now();
    });
}

    function updateStatusCards(source) {
      document.querySelectorAll("[data-status]").forEach((el) => {
          const parts = el.dataset.status.split(".");
          if (parts.length === 2 && source[parts[0]] && source[parts[0]][parts[1]] !== undefined) {
              el.textContent = source[parts[0]][parts[1]];
          }
      });
      const levelText = source.candidate?.level ? (String(source.candidate.level).includes("Level") ? source.candidate.level : "Level " + source.candidate.level) : "Pending";
      document.querySelectorAll('[data-candidate="level"]').forEach(el => el.textContent = levelText);
  }

  function updateLearningJourney(source) {
    const statuses = {
        payment: source.payment?.status,
        enrollment: source.enrollment?.status,
        batch: source.batch?.status,
        exam: source.exam?.status,
        result: source.result?.status,
        certificate: source.certificate?.status,
        placement: source.placement?.applicable
            ? (source.placement.statusLabel || source.placement.status || "Eligible")
            : "Not Applicable"
    };

    const mapKind = (color) => {
        if (color === "green") return "ok";
        if (color === "blue") return "info";
        return "todo";
    };

    const certUrl = (statuses.certificate === "Issued" && source.result?.id) ? `api/admin/certificate_pdf.php?result_id=${source.result.id}` : null;
    
    const list = [
        { key: "payment", title: "Payment", done: isCompleted("payment", statuses.payment), pill: journeyLabel("payment", statuses.payment), kind: mapKind(journeyClass(statuses.payment)) },
        { key: "enrollment", title: "Enrollment", done: isCompleted("enrollment", statuses.enrollment), pill: journeyLabel("enrollment", statuses.enrollment), kind: mapKind(journeyClass(statuses.enrollment)) },
        { key: "batch", title: "Batch & Slot", done: isCompleted("batch", statuses.batch), sub: source.batch?.name || "", pill: journeyLabel("batch", statuses.batch), kind: mapKind(journeyClass(statuses.batch)) },
        { key: "exam", title: "Assessment", done: isCompleted("exam", statuses.exam), pill: journeyLabel("exam", statuses.exam), kind: mapKind(journeyClass(statuses.exam)) },
        { key: "result", title: "Result", done: isCompleted("result", statuses.result), pill: journeyLabel("result", statuses.result), kind: mapKind(journeyClass(statuses.result)) },
        { key: "certificate", title: "Certificate", done: isCompleted("certificate", statuses.certificate), pill: journeyLabel("certificate", statuses.certificate), kind: mapKind(journeyClass(statuses.certificate)), link: certUrl ? { text: "Download", href: certUrl } : null },
        { key: "placement", title: "Placement", done: isCompleted("placement", statuses.placement), pill: journeyLabel("placement", statuses.placement), kind: mapKind(journeyClass(statuses.placement)) }
    ];

    Journey.render(list, { name: source.candidate?.name });
}
function journeyLabel(key, status) {
    if (!status || status === "—") return "—";

    if (key === "payment") return status === "Paid" ? "Completed" : status;
    if (key === "enrollment") return status === "Enrolled" ? "Completed" : status;
    if (key === "batch") return status === "Assigned" ? "Completed" : status;
    if (key === "exam") return status === "Completed" ? "Completed" : status;
    if (key === "result") return status === "Completed" ? "Completed" : status;
    if (key === "certificate") return status === "Issued" ? "Completed" : status;
    if (key === "placement") return status;

    return status;
}

function journeyClass(status) {
    if (["Paid", "Enrolled", "Assigned", "Completed", "Issued", "Placed"].includes(status)) return "green";
    if (["Upcoming", "Scheduled", "In Progress", "Eligible", "Shortlisted", "Interviewing"].includes(status)) return "blue";
    if (["Not Applicable"].includes(status)) return "gray";
    return "gray";
}

function isCompleted(key, status) {
    return (
        (key === "payment" && status === "Paid") ||
        (key === "enrollment" && status === "Enrolled") ||
        (key === "batch" && (status === "Assigned" || status === "Scheduled")) ||
        (key === "exam" && status === "Completed") ||
        (key === "result" && (status === "Completed" || status === "Available")) ||
        (key === "certificate" && status === "Issued") ||
        (key === "placement" && status === "Placed")
    );
}

function bindCandidateLogout() {
    document.querySelectorAll("a.logout, a[href*='logout.php']").forEach((link) => {
        if (link.dataset.logoutBound) return;
        link.dataset.logoutBound = "1";
        link.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                let token = null;
                try {
                    const csrfRes = await fetch("api/auth/csrf.php", {
                        credentials: "same-origin",
                        headers: { Accept: "application/json" }
                    });
                    const csrfData = await csrfRes.json();
                    token = csrfData.data?.token || null;
                } catch { }
                if (!token) {
                    const m7Res = await fetch("/api/admin/evaluate.php?action=csrf", {
                        credentials: "same-origin",
                        headers: { Accept: "application/json" }
                    });
                    const m7Data = await m7Res.json();
                    token = m7Data.data?.token || null;
                }
                await fetch("api/auth/logout.php", {
                    method: "POST",
                    headers: {
                        "Accept": "application/json",
                        "X-CSRF-Token": token || ""
                    }
                });
            } catch (err) {
                console.error("Logout failed:", err);
            } finally {
                window.location.href = "/login.php";
            }
        });
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindCandidateLogout);
} else {
    bindCandidateLogout();
}

function renderCertificateState(source) {
    const certStateContainer = document.getElementById("certificate-state-container");
    const certPreviewCard = document.getElementById("certificate-preview-card");
    const certMainContainer = document.getElementById("certificate-main-container");
    const certBadge = document.getElementById("certificate-status-badge");
    const dashCertDownload = document.getElementById("dashboard-certificate-download");

    if (source.certificate && source.certificate.status === "Issued" && source.result && source.result.id) {
        const downloadUrl = `api/admin/certificate_pdf.php?result_id=${source.result.id}&t=${Date.now()}`;

        if (certStateContainer) {
            certStateContainer.innerHTML = `
                <div class="mx-auto w-16 h-16 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center text-green-600 mb-5">
                    <i data-lucide="award" class="w-8 h-8"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-900 mb-2">Certificate Issued</h3>
                <p class="text-slate-500 mb-6 max-w-sm">Congratulations! Your certificate has been generated successfully and is ready.</p>
                <div class="flex flex-col sm:flex-row justify-center gap-3 w-full sm:w-auto">
                    <a href="${downloadUrl}" target="_blank" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors shadow-sm focus:ring-2 focus:ring-blue-500/20">
                        <i data-lucide="download" class="w-4 h-4"></i> Download PDF
                    </a>
                    <a href="${downloadUrl}&view=1" target="_blank" class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium transition-colors shadow-sm">
                        <i data-lucide="eye" class="w-4 h-4"></i> View Online
                    </a>
                </div>
            `;
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons();
            }
        }

        if (certBadge) {
            certBadge.textContent = "Issued";
            certBadge.className = "inline-flex items-center px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold";
        }

        if (certMainContainer) {
            certMainContainer.className = "grid grid-cols-1 md:grid-cols-2 gap-5 mb-6";
        }

        if (certPreviewCard) {
            certPreviewCard.style.display = "block";
            
            document.querySelectorAll('[data-certificate="number"]').forEach(el => el.textContent = source.certificate.number || '—');
            document.querySelectorAll('[data-certificate="level"]').forEach(el => el.textContent = source.certificate.level || '—');
            document.querySelectorAll('[data-certificate="issue_date"]').forEach(el => el.textContent = source.certificate.issueDate || '—');
        }

        if (dashCertDownload) {
            dashCertDownload.innerHTML = `<a href="${downloadUrl}" target="_blank" style="color: #1652d6; font-weight: bold;">(Download)</a>`;
        }
    } else {
        if (certStateContainer) {
            certStateContainer.innerHTML = `
                <div class="mx-auto w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-5">
                    <i data-lucide="clock" class="w-8 h-8"></i>
                </div>
                <h3 class="text-xl font-bold text-slate-900 mb-2">No Certificate Issued</h3>
                <p class="text-slate-500 max-w-sm">Your certificate will appear here after successful evaluation and level assignment.</p>
            `;
            if (typeof lucide !== 'undefined' && lucide.createIcons) {
                lucide.createIcons();
            }
        }

        if (certBadge) {
            certBadge.textContent = "Pending";
            certBadge.className = "inline-flex items-center px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold";
        }

        if (certMainContainer) {
            certMainContainer.className = "grid grid-cols-1 gap-5 mb-6";
        }

        if (certPreviewCard) {
            certPreviewCard.style.display = "none";
        }
        
        if (dashCertDownload) {
            dashCertDownload.innerHTML = "";
        }
    }
}

function renderProfileState(source) {
    if (!source) return;

    const levelBadge = document.getElementById("profile-level-badge") || document.querySelector("[data-result='level_assigned']");
    if (levelBadge) {
        const assignedLevel = source.result?.level_assigned ||
            (source.result?.level && source.result.level !== "—" ? source.result.level : null) ||
            source.candidate?.level_assigned ||
            (source.candidate?.level && source.candidate.level !== "—" ? source.candidate.level : null);

        if (assignedLevel) {
            levelBadge.textContent = assignedLevel;
            levelBadge.className = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold";
        } else {
            levelBadge.textContent = "Not assigned yet";
            levelBadge.className = "inline-flex items-center px-3 py-1.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-semibold";
        }
    }

    const profileBadge = document.getElementById("profile-status-badge") || document.querySelector("[data-candidate='profileStatus']");
    if (profileBadge) {
        if (source.enrollment && source.enrollment.status === "Enrolled") {
            profileBadge.textContent = "Enrolled";
            profileBadge.className = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold";
        } else {
            profileBadge.textContent = "";
            profileBadge.className = "hidden"; // Tailwind class to hide if not enrolled
        }
    }

    const certContent = document.getElementById("profile-certificate-content");
    if (certContent) {
        const cert = source.certificate;
        const result = source.result;
        const resultId = result?.id || cert?.result_id;
        const isIssued = cert && (cert.status === "Issued" || (cert.number && cert.number !== "Not issued" && cert.number !== "—"));

        if (isIssued && resultId) {
            const downloadUrl = `api/admin/certificate_pdf.php?result_id=${resultId}&t=${Date.now()}`;
            const certNumber = cert.number || cert.certificate_number || "—";
            const certLevel = cert.level || (result?.level && result.level !== "—" ? result.level : "—");
            const issueDate = cert.issueDate || cert.issue_date || "—";

            certContent.innerHTML = `
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    <div class="flex items-center gap-4 min-w-0">
                        <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.5 10.5c-1 0-1.5-.5-2-1.5A3 3 0 0 0 12 6a3 3 0 0 0-5.5 3c-.5 1-1 1.5-2 1.5A3 3 0 0 0 3 13.5c1 0 1.5.5 2 1.5A3 3 0 0 0 10.5 18a3 3 0 0 0 5.5-3c.5-1 1-1.5 2-1.5A3 3 0 0 0 19.5 10.5Z"/></svg>
                        </div>
                        <div class="min-w-0">
                            <p class="text-sm font-semibold text-slate-800">MYLAT Certificate</p>
                            <p class="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                                <span>No: <strong class="text-slate-800">${certNumber}</strong></span>
                                <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
                                <span>Level: <strong class="text-slate-800">${certLevel}</strong></span>
                                <span class="w-1 h-1 bg-slate-300 rounded-full"></span>
                                <span>Issued: <strong class="text-slate-800">${issueDate}</strong></span>
                            </p>
                        </div>
                    </div>
                    <div class="shrink-0 flex flex-wrap items-center gap-3">
                        <span class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold">
                            <span class="w-2 h-2 rounded-full bg-emerald-500"></span> Issued
                        </span>
                        <a href="${downloadUrl}" target="_blank" class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold shadow-sm transition">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                            Download
                        </a>
                    </div>
                </div>
            `;
        } else {
            certContent.innerHTML = `
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    <div class="flex items-center gap-4 min-w-0">
                        <div class="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.5 10.5c-1 0-1.5-.5-2-1.5A3 3 0 0 0 12 6a3 3 0 0 0-5.5 3c-.5 1-1 1.5-2 1.5A3 3 0 0 0 3 13.5c1 0 1.5.5 2 1.5A3 3 0 0 0 10.5 18a3 3 0 0 0 5.5-3c.5-1 1-1.5 2-1.5A3 3 0 0 0 19.5 10.5Z"/></svg>
                        </div>
                        <div class="min-w-0">
                            <p class="text-sm font-semibold text-slate-800">MYLAT Certificate</p>
                            <p class="text-xs text-slate-500 mt-1">Your certificate will appear here once it is issued.</p>
                        </div>
                    </div>
                    <div class="shrink-0">
                        <span class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-semibold">
                            <span class="w-2 h-2 rounded-full bg-slate-400"></span> Not issued yet
                        </span>
                    </div>
                </div>
            `;
        }
    }
}

function renderEnrollmentState(source) {
    if (!source) return;

    const hero = document.getElementById("enrollment-hero");
    const statusBadge = document.getElementById("enrollment-status-badge");
    const nextStepContainer = document.getElementById("enrollment-next-step-container");

    if (!hero && !statusBadge) return;

    const heroTitle = document.getElementById("enrollment-hero-title") || hero?.querySelector("h2");
    const heroDesc = document.getElementById("enrollment-hero-desc") || hero?.querySelector("p");

    const enrStatus = source.enrollment?.status;
    const payStatus = source.payment?.status;
    const hasEnrollmentId = source.enrollment?.id && source.enrollment.id !== "—";

    let nextStepHtml = '';

    // 1. Confirmed (payment verified + enrollment created/active)
    if (enrStatus === "Enrolled" || enrStatus === "Confirmed" || enrStatus === "Active" || (hasEnrollmentId && enrStatus !== "Pending" && enrStatus !== "Not Enrolled")) {
        if (heroTitle) heroTitle.textContent = "Enrollment Confirmed";
        if (heroDesc) heroDesc.textContent = "Your payment has been verified and your enrollment has been created successfully.";
        if (statusBadge) {
            statusBadge.textContent = enrStatus && enrStatus !== "—" ? enrStatus : "Enrolled";
            statusBadge.className = "badge green";
        }
        
        // Check overall progress for Next Step
        if (source.certificate && source.certificate.status === "Issued") {
            nextStepHtml = `
              <div class="rounded-xl border border-green-100 bg-green-50 p-5">
                <div class="flex gap-3">
                  <div class="w-10 h-10 shrink-0 rounded-xl bg-white text-green-600 flex items-center justify-center shadow-sm">
                    <i data-lucide="award" class="w-5 h-5"></i>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-green-900">Program Completed</p>
                    <p class="mt-1 text-sm leading-6 text-green-700">You have successfully completed your assessment and your certificate has been issued.</p>
                  </div>
                </div>
              </div>
              <a href="certificates.html" class="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition">
                View Certificates
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </a>
            `;
        } else if (source.result && (source.result.status === "Completed" || source.result.status === "Available" || source.result.id)) {
            nextStepHtml = `
              <div class="rounded-xl border border-purple-100 bg-purple-50 p-5">
                <div class="flex gap-3">
                  <div class="w-10 h-10 shrink-0 rounded-xl bg-white text-purple-600 flex items-center justify-center shadow-sm">
                    <i data-lucide="file-check-2" class="w-5 h-5"></i>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-purple-900">Result Evaluated</p>
                    <p class="mt-1 text-sm leading-6 text-purple-700">Your assessment result has been evaluated. Please check your results.</p>
                  </div>
                </div>
              </div>
              <a href="results.html" class="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold transition">
                View Results
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </a>
            `;
        } else if (source.exam && source.exam.status === "Completed") {
            nextStepHtml = `
              <div class="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
                <div class="flex gap-3">
                  <div class="w-10 h-10 shrink-0 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-sm">
                    <i data-lucide="timer" class="w-5 h-5"></i>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-indigo-900">Evaluation Pending</p>
                    <p class="mt-1 text-sm leading-6 text-indigo-700">You have completed the assessment. Your results are currently being evaluated.</p>
                  </div>
                </div>
              </div>
              <a href="results.html" class="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition">
                Go to Results
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </a>
            `;
        } else if (source.batch && source.batch.status === "Assigned") {
            nextStepHtml = `
              <div class="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <div class="flex gap-3">
                  <div class="w-10 h-10 shrink-0 rounded-xl bg-white text-blue-600 flex items-center justify-center shadow-sm">
                    <i data-lucide="laptop" class="w-5 h-5"></i>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-blue-900">Take Assessment</p>
                    <p class="mt-1 text-sm leading-6 text-blue-700">Your batch has been assigned. Please proceed to take the assessment during your slot.</p>
                  </div>
                </div>
              </div>
              <a href="exam.html" class="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition">
                Go to Exam
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </a>
            `;
        } else {
            nextStepHtml = `
              <div class="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <div class="flex gap-3">
                  <div class="w-10 h-10 shrink-0 rounded-xl bg-white text-blue-600 flex items-center justify-center shadow-sm">
                    <i data-lucide="calendar-days" class="w-5 h-5"></i>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-blue-900">Batch &amp; Slot Assignment</p>
                    <p class="mt-1 text-sm leading-6 text-blue-700">Your next step is batch and slot assignment. You will see the details here once they are assigned.</p>
                  </div>
                </div>
              </div>
              <a href="batches-slots.html" class="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition">
                View Batches &amp; Slots
                <i data-lucide="arrow-right" class="w-4 h-4"></i>
              </a>
            `;
        }
    }
    // 2. Pending (payment done, enrollment processing)
    else if (enrStatus === "Pending" || (payStatus === "Paid" && !hasEnrollmentId)) {
        if (heroTitle) heroTitle.textContent = "Enrollment Pending";
        if (heroDesc) heroDesc.textContent = "Your payment has been received and your enrollment is currently being processed.";
        if (statusBadge) {
            statusBadge.textContent = "Pending";
            statusBadge.className = "badge yellow";
        }
        nextStepHtml = `
          <div class="rounded-xl border border-yellow-100 bg-yellow-50 p-5">
            <div class="flex gap-3">
              <div class="w-10 h-10 shrink-0 rounded-xl bg-white text-yellow-600 flex items-center justify-center shadow-sm">
                <i data-lucide="clock" class="w-5 h-5"></i>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-yellow-900">Enrollment Processing</p>
                <p class="mt-1 text-sm leading-6 text-yellow-700">Your enrollment is pending verification. Please check back shortly once your batch is allocated.</p>
              </div>
            </div>
          </div>
        `;
    }
    // 3. Failed (payment not verified / failed)
    else if (payStatus === "Failed" || enrStatus === "Failed") {
        if (heroTitle) heroTitle.textContent = "Payment Failed";
        if (heroDesc) heroDesc.textContent = "Your payment could not be verified. Please complete your payment to proceed with enrollment.";
        if (statusBadge) {
            statusBadge.textContent = "Failed";
            statusBadge.className = "badge gray";
        }
        nextStepHtml = `
          <div class="rounded-xl border border-rose-100 bg-rose-50 p-5">
            <div class="flex gap-3">
              <div class="w-10 h-10 shrink-0 rounded-xl bg-white text-rose-600 flex items-center justify-center shadow-sm">
                <i data-lucide="alert-circle" class="w-5 h-5"></i>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-rose-900">Action Required</p>
                <p class="mt-1 text-sm leading-6 text-rose-700">Please retry your payment and complete your enrollment.</p>
              </div>
            </div>
          </div>
          <a href="payment.html" class="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition">
            Go to Payments
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </a>
        `;
    }
    // 4. Not Started / Not Enrolled
    else {
        if (heroTitle) heroTitle.textContent = "Enrollment Not Started";
        if (heroDesc) heroDesc.textContent = "Please complete your payment to verify and confirm your enrollment.";
        if (statusBadge) {
            statusBadge.textContent = enrStatus && enrStatus !== "—" ? enrStatus : "Not Enrolled";
            statusBadge.className = "badge gray";
        }
        nextStepHtml = `
          <div class="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div class="flex gap-3">
              <div class="w-10 h-10 shrink-0 rounded-xl bg-white text-slate-600 flex items-center justify-center shadow-sm">
                <i data-lucide="credit-card" class="w-5 h-5"></i>
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-900">Payment Pending</p>
                <p class="mt-1 text-sm leading-6 text-slate-700">Please pay the registration fee and start your enrollment.</p>
              </div>
            </div>
          </div>
          <a href="payment.html" class="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition">
            Go to Payments
            <i data-lucide="arrow-right" class="w-4 h-4"></i>
          </a>
        `;
    }

    if (nextStepContainer && nextStepHtml) {
        nextStepContainer.innerHTML = nextStepHtml;
        if (typeof lucide !== 'undefined' && lucide.createIcons) {
            lucide.createIcons();
        }
    }
}

function renderResultState(source) {
    const container = document.getElementById('result-state-container');
    if (!container) return;

    if (source.result && source.result.status === 'Available') {
        const badge = document.getElementById('result-status-badge');
        if (badge) {
            badge.className = 'inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold';
            badge.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Available';
        }

        container.innerHTML = `
            <div class="mx-auto w-14 h-14 rounded-2xl bg-white border border-emerald-100 flex items-center justify-center text-emerald-500 mb-5">
                <i data-lucide="check-circle" class="w-7 h-7"></i>
            </div>
            <h2 class="text-xl font-semibold text-slate-900">Result Evaluated</h2>
            <p class="mt-2 text-sm text-slate-600 max-w-md mx-auto leading-6">
                Your assessment has been successfully evaluated. Your final score and assigned level are now available below.
            </p>
        `;
        container.className = 'rounded-2xl border border-emerald-100 bg-emerald-50 px-6 py-10 text-center';
        if (window.lucide) { window.lucide.createIcons(); }
    }
}


/* === LEVEL CARD COMPONENT === */
const LevelCard = (() => {
  const MAX = 5, MIN_PLACEMENT = 3;
  const NAMES = ["Top / Excellent", "Intermediate", "Employable", "Basic Knowledge", "Needs Training"];
  const $ = id => document.getElementById(id);

  function update({ level = 0 } = {}) {
    level = Math.max(0, Math.min(MAX, Math.round(+level) || 0));
    const h = $("lcLevel");
    if(!h) return;
    h.textContent = level ? "Level " + level : "Pending";
    h.classList.remove("pop"); void h.offsetWidth; h.classList.add("pop");
    
    $("lcChip").textContent = level === 1 ? "Top level" : NAMES[level - 1] || "Not started";
    
    // Level 1 is best (5 segments), Level 5 is worst (1 segment)
    const power = level ? (6 - level) : 0;
    $("lcSeg").innerHTML = Array.from({ length: MAX }, (_, i) =>
      `<i class="${i < power ? "on" : ""}${i + 1 === power ? " me" : ""}"></i>`).join("");
      
    $("lcMsg").textContent = !level ? "Complete your assessment to get your level."
      : level === 1 ? "Highest level achieved, decided from your assessment result."
      : "Level " + level + " of " + MAX + ", decided from your assessment result.";
      
          let titleText = "Placement eligibility";
      let eligibilityText = "Available after your level is decided";
      let pillText = "Pending";
      let pillClass = "no";
      
      if (level === 1) {
          eligibilityText = "Eligible for 10+ LPA Placements";
          pillText = "10+ LPA";
          pillClass = "ok";
      } else if (level === 2) {
          eligibilityText = "Eligible for 5-10 LPA Placements";
          pillText = "5-10 LPA";
          pillClass = "ok";
      } else if (level === 3) {
          eligibilityText = "Eligible for 0-5 LPA Placements";
          pillText = "0-5 LPA";
          pillClass = "ok";
      } else if (level === 4) {
          titleText = "Internship eligibility";
          eligibilityText = "Eligible for Paid Internships";
          pillText = "Internship";
          pillClass = "ok";
      } else if (level === 5) {
          titleText = "Training & Upskilling";
          eligibilityText = "Recommended for Training programs";
          pillText = "Training";
          pillClass = "no";
      }

      const titleEl = document.getElementById("lcPlTitle");
      if (titleEl) titleEl.textContent = titleText;
      document.getElementById("lcPlTxt").textContent = eligibilityText;
      document.getElementById("lcPlPill").textContent = pillText;
      document.getElementById("lcPlPill").className = "lc-pill " + pillClass;
  }

  function poll(url, ms = 30000, map = d => d) {
    let last = null;
    const run = async () => {
      try {
        const r = await fetch(url, { credentials: "include" });
        if (!r.ok) return;
        const d = map(await r.json()), k = JSON.stringify(d);
        if (k !== last) { last = k; update(d); }
      } catch (e) { console.warn("level poll failed", e); }
    };
    run();
    return setInterval(run, ms);
  }
  return { update, poll };
})();

document.addEventListener("DOMContentLoaded", () => {
  LevelCard.update({ level: 0 });
});


/* ===== NEW JOURNEY JS ===== */
const Journey=(()=>{
  const SEG=1000, DWELL=550;
  const ICONS={
    payment:'<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h3"/>',
    enrollment:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4h6v3H9zM9 14l2 2 4-4"/>',
    batch:'<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
    exam:'<path d="M12 20h8M4 20l1-4L16 5a2.1 2.1 0 013 3L8 19z"/>',
    result:'<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    certificate:'<circle cx="12" cy="9" r="5"/><path d="M9 13.5L8 21l4-2 4 2-1-7.5"/>',
    placement:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2M3 13h18"/>'};
  const $=id=>document.getElementById(id), W=1000, H=240;
  const svg=k=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]||ICONS.placement}</svg>`;
  const calm=matchMedia('(prefers-reduced-motion:reduce)').matches;
  let ms=[], prev=[], keys='', els=[], ini='YM', lastOk=Date.now(), tm, run=0, fast=calm, busy=false, pos=-1, len=1, n=0;
  const wait=t=>new Promise(r=>setTimeout(r,fast?0:t));
  const nextIdx=a=>a.findIndex(m=>!m.done), lastIdx=a=>{const i=nextIdx(a);return i<0?a.length-1:i};
  const flash=i=>{const e=els[i];if(e){e.classList.add('flash');setTimeout(()=>e.classList.remove('flash'),1400)}};

  function paint(i,m,ni,reveal){
    const el=els[i], st=m.done?'done':i===ni?'next':'todo';
    el.classList.remove('done','next','todo'); el.classList.add(st); if(reveal) el.classList.add('seen');
    el.querySelector('.jr-me').textContent=ini;
    el.querySelector('.jr-sub2').textContent=m.sub||'';
    const p=el.querySelector('.jr-pill'), txt=m.pill||(m.done?'Completed':'Pending');
    if(reveal&&p.textContent&&p.textContent!==txt&&!fast) p.animate([{transform:'scale(.6)',opacity:0},{transform:'scale(1.15)',offset:.6},{transform:'scale(1)',opacity:1}],{duration:550,easing:'ease-out'});
    p.textContent=txt; p.className='jr-pill '+(m.kind||(m.done?'ok':'todo'));
    const a=el.querySelector('a'); a.textContent=m.link?m.link.text:''; a.href=m.link&&m.link.href||'#';
  }
  function setCount(c,final,ni){
    const b=$('jrCount'), s=$('jrNext'); b.textContent=c+'/'+ms.length; b.classList.remove('tick'); void b.offsetWidth; b.classList.add('tick');
    s.innerHTML=!final?'Tracing your path�':ni<0?'<em>All milestones complete</em>':'Up next: <em>'+ms[ni].title+'</em>';
    if(final){s.classList.remove('tick');void s.offsetWidth;s.classList.add('tick')}
  }
  function setOrb(L){const p=$('jrProg'),pt=p.getPointAtLength(L),o=$('jrOrb');
    o.style.left=(pt.x/W*100)+'%'; o.style.top=(pt.y/H*100)+'%'; p.style.strokeDashoffset=1-L/len}
  function travel(a,b,my){return new Promise(res=>{
    const La=a/(n-1)*len, Lb=b/(n-1)*len; $('jrProg').style.transition='none';
    (function f(t,t0){ if(my!==run) return res(); if(fast){setOrb(Lb);return res()}
      const k=Math.min((t-t0)/SEG,1), e=k<.5?4*k*k*k:1-Math.pow(-2*k+2,3)/2; setOrb(La+(Lb-La)*e);
      k<1?requestAnimationFrame(x=>f(x,t0)):res()})(performance.now(),performance.now())})}
  function arrive(i,ni){
    paint(i,ms[i],ni,true); flash(i);
    els[i].querySelector('.jr-node').animate([{transform:'scale(.8)'},{transform:'scale(1.18)',offset:.55},{transform:'scale(1)'}],{duration:fast?1:700,easing:'cubic-bezier(.3,1.4,.5,1)'});
    setCount(ms.slice(0,i+1).filter(x=>x.done).length,false,ni);
  }
  function build(){
    n=ms.length; const stage=$('jrStage'); stage.querySelectorAll('.jr-it').forEach(e=>e.remove()); els=[];
    const X=i=>(i+.5)/n*W, Y=i=>i%2?H*0.65:H*0.35; let d=`M${X(0)} ${Y(0)}`;
    for(let i=1;i<n;i++){const h=(X(i)-X(i-1))/2;d+=` C${X(i-1)+h} ${Y(i-1)} ${X(i)-h} ${Y(i)} ${X(i)} ${Y(i)}`}
    $('jrBase').setAttribute('d',d); const p=$('jrProg'); p.setAttribute('d',d); len=p.getTotalLength(); p.style.transition='none'; p.style.strokeDashoffset=1;
    ms.forEach((m,i)=>{const el=document.createElement('div');
      el.style.setProperty('--x',(X(i)/W*100)+'%'); el.style.setProperty('--y',(Y(i)/H*100)+'%'); el.className='jr-it '+(i%2?'dn':'up');
      el.innerHTML=`<div class="jr-node">${svg(m.key)}<span class="jr-ok"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><span class="jr-me"></span></div>
        <div class="jr-card"><span class="jr-no">${String(i+1).padStart(2,'0')}</span><h3>${m.title}</h3><span class="jr-sub2"></span><span class="jr-pill"></span><a></a></div>`;
      stage.appendChild(el); els.push(el); paint(i,{...m,done:false,pill:'Pending',kind:'todo',sub:'',link:null},-1,false)});
  }

  async function intro(){
    const my=++run; fast=calm; busy=true; build();
    const ni=nextIdx(ms), end=lastIdx(ms), orb=$('jrOrb'); setCount(0,false,ni);
    await wait(500); if(my!==run) return;
    setOrb(0); orb.classList.add('on'); await wait(350); if(my!==run) return;
    arrive(0,ni); await wait(DWELL);
    for(let i=1;i<=end;i++){
      await travel(i-1,i,my); if(my!==run) return;
      arrive(i,ni); if(i<end) await wait(DWELL); if(my!==run) return;
    }
    await wait(250); orb.classList.remove('on'); await wait(350); if(my!==run) return;
    for(let i=end+1;i<n;i++){ paint(i,ms[i],ni,true); await wait(120); if(my!==run) return }
    setCount(ms.filter(x=>x.done).length,true,ni); prev=ms.map(m=>JSON.stringify(m)); pos=end; busy=false;
  }

  async function applyDiff(){
    const ni=nextIdx(ms), end=lastIdx(ms), changed=ms.map((m,i)=>JSON.stringify(m)!==prev[i]?i:-1).filter(i=>i>=0);
    if(!changed.length) return;
    const my=++run; fast=calm; busy=true; const fwd=end>pos, orb=$('jrOrb');
    ms.forEach((m,i)=>{ if(!(fwd&&i>pos&&i<=end)){ paint(i,m,ni,true); if(changed.includes(i)) flash(i) } });
    const c=ms[changed.find(i=>JSON.parse(prev[i]).done!==ms[i].done)??changed[0]];
    toast(c.title+': '+(c.pill||(c.done?'Completed':'Updated')));
    if(fwd){
      await wait(900); if(my!==run) return; setOrb(pos/(n-1)*len); orb.classList.add('on'); await wait(300);
      for(let i=pos+1;i<=end;i++){ await travel(i-1,i,my); if(my!==run) return; arrive(i,ni); await wait(DWELL); if(my!==run) return }
      orb.classList.remove('on');
    } else { const p=$('jrProg'); p.style.transition='stroke-dashoffset .8s ease'; p.style.strokeDashoffset=1-end/(n-1) }
    setCount(ms.filter(x=>x.done).length,true,ni); prev=ms.map(m=>JSON.stringify(m)); pos=end; busy=false;
  }
  function toast(t){const e=$('jrToast');if(e){e.textContent=t;e.classList.add('show');clearTimeout(tm);tm=setTimeout(()=>e.classList.remove('show'),5000)}}

  function ok(){lastOk=Date.now();const l=$('jrLive');if(l)l.classList.remove('err');ago()}
  function err(){const l=$('jrLive'),a=$('jrAgo');if(l)l.classList.add('err');if(a)a.textContent='Reconnecting�'}
  function ago(){const l=$('jrLive');if(!l||l.classList.contains('err'))return;const s=Math.round((Date.now()-lastOk)/1000),a=$('jrAgo');if(a)a.textContent=s<8?'Live':'Updated '+(s<60?s+'s':Math.floor(s/60)+'m')+' ago'}
  setInterval(ago,5000);
  const stg=$('jrStage'); if(stg) stg.addEventListener('click',()=>{ if(busy) fast=true });

  function render(list,{name,replay}={}){
    if(name){const w=String(name).trim().split(/\s+/);ini=((w[0]||'Y')[0]+(w[1]?w[1][0]:'')).toUpperCase()}
    const k=list.map(m=>m.key).join(); ms=list; ok();
    if(replay||k!==keys||busy&&!prev.length){keys=k;intro()} else applyDiff();
  }
  return {render,fail:err};
})();
