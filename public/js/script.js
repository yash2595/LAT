/* ==========================================================
   InternBoot — Landing Page (M2)
   Pure JavaScript + Bootstrap 5
   
   EDIT ONLY THE CONFIG BELOW when the client confirms the
   pending numbers (fee, batch size, duration, level ranges).
   Nothing is hardcoded anywhere in index.html.
   ========================================================== */

const IB_CONFIG = {
  /* --- money & batch --- */
  fee: "₹2999 <span style='display:block; font-size:0.75em; font-weight:500; opacity:0.9; line-height:1; margin-top:0.25rem;'>+ 18% GST</span>",
  feeShort: "₹2999 <span style='font-size:0.8em; opacity:0.9;'>+ 18% GST</span>",
  gstNote: "+ 18% GST applicable",
  batchSize: "100",
  batchNumber: "",

  /* --- exam --- */
  duration: "60 minutes",
  questions: "100 questions",

  /* --- result --- */
  resultTiming: "within a few minutes of submission",
  retake: "No, you can only take the test once per drive.",
  placementLevels: "1 and 2",

  /* Assessment thresholds power the existing estimator; the level pathway shows career outcomes. */
  levels: [
    {
      level: 1,
      name: "Top / Excellent",
      glowColor: "rgba(16, 185, 129, 0.25)",
      desc: "Strong command of the core assessment areas, with placement opportunities in the 10+ LPA package band.",
      outcome: "10+ LPA",
      outcomeLabel: "PACKAGE OPPORTUNITIES",
      nextStep: "Explore placement roles in the 10+ LPA package band.",
      color: "#c9a85c",
    },
    {
      level: 2,
      name: "Intermediate",
      glowColor: "rgba(59, 130, 246, 0.25)",
      desc: "Job-ready fundamentals, with placement opportunities in the 5–10 LPA package band.",
      outcome: "5–10 LPA",
      outcomeLabel: "PACKAGE OPPORTUNITIES",
      nextStep: "Explore placement roles in the 5–10 LPA package band.",
      color: "#91b9a4",
    },
    {
      level: 3,
      name: "Basic / Employable",
      glowColor: "rgba(6, 182, 212, 0.25)",
      desc: "A solid grasp of fundamentals, with placement opportunities up to the 5 LPA package band.",
      outcome: "Up to 5 LPA",
      outcomeLabel: "PACKAGE OPPORTUNITIES",
      nextStep: "Explore entry-level placement opportunities up to 5 LPA.",
      color: "#87b9c0",
    },
    {
      level: 4,
      name: "Basic Knowledge",
      glowColor: "rgba(245, 158, 11, 0.25)",
      desc: "A working knowledge of core concepts, with a paid internship as the next opportunity.",
      outcome: "Paid internship",
      outcomeLabel: "NEXT OPPORTUNITY",
      nextStep: "Build practical experience through a paid internship.",
      color: "#d6a358",
    },
    {
      level: 5,
      name: "Needs Training",
      glowColor: "rgba(244, 63, 94, 0.25)",
      desc: "Strengthen your foundation through training, then progress to an internship.",
      outcome: "Training → internship",
      outcomeLabel: "NEXT OPPORTUNITY",
      nextStep: "Strengthen your foundation through training, then progress to internship.",
      color: "#d07c65",
    }
  ]
};

document.addEventListener("DOMContentLoaded", () => {

  /* ---------- 0. Full-page section entrances ---------- */
  const motionItems = document.querySelectorAll(
    "#how .hiw-intro, #how .hiw-flow-step, #pattern .section-head, #pattern .pattern-card, #fee .section-head, #fee .fee-card, #contact .section-head, #contact .card, #faq .section-head, #faq .accordion-item, #faq .faq-support-box, .ib-cta .container > *"
  );
  if (motionItems.length) {
    motionItems.forEach((item, index) => {
      item.classList.add("motion-in");
      const siblings = item.parentElement ? Array.from(item.parentElement.children) : [];
      item.style.setProperty("--motion-delay", `${Math.min(siblings.indexOf(item), 5) * 75}ms`);
    });
    if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const motionObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -32px 0px" });
      motionItems.forEach(item => motionObserver.observe(item));
    } else {
      motionItems.forEach(item => item.classList.add("is-visible"));
    }
  }

  /* ---------- 1. Push config values into the page ---------- */
  document.querySelectorAll("[data-ib]").forEach(el => {
    const key = el.getAttribute("data-ib");
    if (IB_CONFIG[key]) el.innerHTML = IB_CONFIG[key];
  });

  /* ---------- 2. Hero ladder with enhanced visuals & icons ---------- */
  const ladder = document.getElementById("heroLadder");
  if (ladder) {
    ladder.innerHTML = IB_CONFIG.levels.map(l => `
      <div class="rung" data-level="${l.level}" data-tooltip="${l.outcome}">
        <span class="rung-no">${l.level}</span>
        <span class="rung-name">
          ${l.name}
    
        </span>
        <span class="rung-score">${l.outcome}</span>
      </div>`).join("");
  }

  /* ---------- 2b. Ladder card 3D tilt — pressed side down, opposite side up ---------- */
  const ladderCard = document.querySelector(".ladder-card");
  if (ladderCard) {
    const MAX_TILT = 16;

    const applyTilt = (clientX, clientY) => {
      const rect = ladderCard.getBoundingClientRect();
      const x = Math.min(Math.max(clientX - rect.left, 0), rect.width);
      const y = Math.min(Math.max(clientY - rect.top, 0), rect.height);
      const rotateY = -((x / rect.width) - 0.5) * 2 * MAX_TILT;
      const rotateX = -((y / rect.height) - 0.5) * 2 * MAX_TILT;

      ladderCard.style.setProperty("--tilt-x", `${rotateX.toFixed(2)}deg`);
      ladderCard.style.setProperty("--tilt-y", `${rotateY.toFixed(2)}deg`);
      ladderCard.style.setProperty("--lift", "-10px");
      ladderCard.classList.add("is-tilting");
    };

    const resetTilt = () => {
      ladderCard.classList.remove("is-tilting");
      ladderCard.style.setProperty("--tilt-x", "0deg");
      ladderCard.style.setProperty("--tilt-y", "0deg");
      ladderCard.style.setProperty("--lift", "0px");
    };

    ladderCard.addEventListener("mousemove", (e) => applyTilt(e.clientX, e.clientY));
    ladderCard.addEventListener("mouseleave", resetTilt);

    ladderCard.addEventListener("touchstart", (e) => {
      if (e.touches[0]) applyTilt(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    ladderCard.addEventListener("touchmove", (e) => {
      if (e.touches[0]) applyTilt(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    ladderCard.addEventListener("touchend", resetTilt);
    ladderCard.addEventListener("touchcancel", resetTilt);
  }

  /* ---------- 2c. How It Works — scroll reveal + active step highlight ---------- */
  const hiwSteps = document.querySelectorAll(".hiw-flow-step");
  if (hiwSteps.length) {
    const routeStep = document.getElementById("hiwRouteStep");
    const routeOrb = document.getElementById("hiwRouteOrb");
    const routeTitle = document.getElementById("hiwRouteTitle");
    const routeProgress = document.getElementById("hiwRouteProgress");
    const setJourneyStep = (index) => {
      const step = hiwSteps[index];
      if (!step) return;
      const label = step.querySelector(".hiw-flow-title")?.textContent?.trim() || "Your next step";
      const number = String(index + 1).padStart(2, "0");
      if (routeStep) routeStep.textContent = number;
      if (routeOrb) routeOrb.textContent = number;
      if (routeTitle) routeTitle.textContent = label;
      if (routeProgress) routeProgress.style.setProperty("--journey-fill", `${((index + 1) / hiwSteps.length) * 100}%`);
    };
    setJourneyStep(0);
    hiwSteps.forEach((step, index) => {
      step.style.setProperty("--hiw-delay", `${index * 0.08}s`);
    });

    if ("IntersectionObserver" in window) {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-revealed");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.2, rootMargin: "0px 0px -40px 0px" }
      );
      hiwSteps.forEach((step) => revealObserver.observe(step));

      const activeObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              hiwSteps.forEach((step) => step.classList.remove("is-active"));
              entry.target.classList.add("is-active");
              setJourneyStep(Number(entry.target.querySelector(".hiw-flow-num")?.textContent || 1) - 1);
            }
          });
        },
        { threshold: 0.55, rootMargin: "-25% 0px -25% 0px" }
      );
      hiwSteps.forEach((step) => activeObserver.observe(step));
    } else {
      hiwSteps.forEach((step) => {
        step.classList.add("is-revealed");
        step.classList.add("is-active");
      });
    }
  }

  /* ---------- 3. Career runway: five outcomes stay in view as the spotlight travels ---------- */
  const grid = document.getElementById("levelGrid");
  if (grid) {
    const levels = IB_CONFIG.levels;
    const orbit = grid.querySelector(".runway-orbit-art");
    const feature = document.getElementById("runwayFeature");
    const theatre = document.getElementById("folioTheatre");
    const counter = document.getElementById("bookPageCount");
    const label = document.getElementById("bookCurrentLabel");
    const caption = document.getElementById("bookSceneCaption");
    const progress = document.getElementById("bookProgressTrack");
    const playButton = document.getElementById("bookPlay");
    const levelDuration = 4300;
    const count = levels.length;
    let startedAt = performance.now();
    let frozenAt = 0;
    let isPlaying = true;
    let isVisible = true;
    let rafId = 0;
    let activeIndex = -1;
    let lastPaint = 0;

    const outcomeMarkup = levels.map((l, i) => `<button type="button" class="runway-stop" role="tab" aria-label="Level ${l.level}: ${l.name}, ${l.outcome}" aria-selected="${i === 0}" data-goto-level="${i}" style="--stop-color:${l.color};--stop-i:${i}"><span class="runway-stop-num">0${l.level}</span><span class="runway-stop-copy"><b>${l.name}</b><small>${l.outcome}</small></span><i class="runway-stop-node"></i></button>`).join("");
    progress.innerHTML = `<div class="runway-track-line"><i></i></div>${outcomeMarkup}`;
    const stops = [...progress.querySelectorAll(".runway-stop")];
    const updateLevel = (index) => {
      if (index === activeIndex) return;
      activeIndex = index;
      const l = levels[index];
      feature.innerHTML = `<div class="runway-feature-copy" key="${l.level}"><span class="runway-level-tag"><i></i> LEVEL 0${l.level} <b>·</b> ${l.name.toUpperCase()}</span><h3>${l.name}</h3><p>${l.desc}</p><div class="runway-outcome"><span>${l.outcomeLabel}</span><strong>${l.outcome}</strong><small>${l.nextStep}</small></div></div><div class="runway-signal"><div class="runway-signal-rings"><i></i><i></i><i></i><b>0${l.level}</b><span></span></div><small>SKILL<br>ASSESSMENT</small></div>`;
      feature.style.setProperty("--active-color", l.color);
      feature.classList.remove("is-changing");
      void feature.offsetWidth;
      feature.classList.add("is-changing");
      counter.innerHTML = `LEVEL 0${l.level} <b>·</b> 05`;
      label.textContent = l.outcome.toUpperCase();
      caption.textContent = l.name.toUpperCase();
      stops.forEach((stop, i) => {
        stop.classList.toggle("is-current", i === index);
        stop.classList.toggle("is-past", i < index);
        stop.setAttribute("aria-selected", String(i === index));
      });
      grid.style.setProperty("--route-progress", `${index / (count - 1) * 100}%`);
      grid.style.setProperty("--orbit-turn", `${index * 72}deg`);
    };
    const paintRunway = (now) => {
      if (!isPlaying || !isVisible) return;
      if (now - lastPaint > 90) {
        lastPaint = now;
        const elapsed = (now - startedAt) % (levelDuration * count);
        updateLevel(Math.floor(elapsed / levelDuration));
        grid.style.setProperty("--signal-travel", `${(elapsed % levelDuration) / levelDuration * 100}%`);
        if (orbit) orbit.style.setProperty("--orbit-drift", `${now * .006}deg`);
      }
      rafId = requestAnimationFrame(paintRunway);
    };
    const startAnimation = () => { if (!rafId && isPlaying && isVisible) rafId = requestAnimationFrame(paintRunway); };
    const stopAnimation = () => { if (rafId) cancelAnimationFrame(rafId); rafId = 0; };
    const jumpToLevel = (index) => {
      frozenAt = ((index * levelDuration) + 250) % (levelDuration * count);
      startedAt = performance.now() - frozenAt;
      updateLevel(index);
      grid.style.setProperty("--signal-travel", "0%");
    };
    progress.addEventListener("click", (event) => {
      const step = event.target.closest("[data-goto-level]");
      if (step) jumpToLevel(Number(step.dataset.gotoLevel));
    });
    document.getElementById("bookPrev").addEventListener("click", () => jumpToLevel((activeIndex + count - 1) % count));
    document.getElementById("bookNext").addEventListener("click", () => jumpToLevel((activeIndex + 1) % count));
    playButton.addEventListener("click", () => {
      if (isPlaying) {
        frozenAt = (performance.now() - startedAt) % (levelDuration * count);
        isPlaying = false;
        stopAnimation();
        playButton.setAttribute("aria-label", "Play animation");
        playButton.innerHTML = '<i class="bi bi-play-fill"></i>';
        theatre.classList.add("is-paused");
      } else {
        startedAt = performance.now() - frozenAt;
        isPlaying = true;
        playButton.setAttribute("aria-label", "Pause animation");
        playButton.innerHTML = '<i class="bi bi-pause-fill"></i>';
        theatre.classList.remove("is-paused");
        startAnimation();
      }
    });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        isVisible = entries.some(entry => entry.isIntersecting);
        if (isVisible) startAnimation(); else stopAnimation();
      }, { threshold: 0.14 }).observe(theatre);
    }
    document.addEventListener("visibilitychange", () => { if (document.hidden) stopAnimation(); else startAnimation(); });
    grid.addEventListener("pointermove", (event) => {
      const box = grid.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - .5;
      const y = (event.clientY - box.top) / box.height - .5;
      grid.style.setProperty("--pointer-x", `${(x * 1.4).toFixed(2)}deg`);
      grid.style.setProperty("--pointer-y", `${(-y * 1.1).toFixed(2)}deg`);
    });
    grid.addEventListener("pointerleave", () => {
      grid.style.setProperty("--pointer-x", "0deg");
      grid.style.setProperty("--pointer-y", "0deg");
    });
    updateLevel(0);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      isPlaying = false;
      frozenAt = 0;
      playButton.setAttribute("aria-label", "Play animation");
      playButton.innerHTML = '<i class="bi bi-play-fill"></i>';
      theatre.classList.add("is-paused");
    } else startAnimation();
  }
  /* ---------- 4. Interactive Score & Level Estimator ---------- */
  const scoreInput = document.getElementById("scoreRangeInput");
  const scoreDisplay = document.getElementById("scoreValDisplay");
  const levelBadgeDisplay = document.getElementById("levelBadgeDisplay");
  const levelDescDisplay = document.getElementById("levelDescDisplay");

  const updateEstimator = (score) => {
    if (!scoreDisplay) return;
    scoreDisplay.textContent = score + "%";

    let matched = IB_CONFIG.levels[4];
    if (score >= 85) {
      matched = IB_CONFIG.levels[0];
    } else if (score >= 70) {
      matched = IB_CONFIG.levels[1];
    } else if (score >= 55) {
      matched = IB_CONFIG.levels[2];
    } else if (score >= 40) {
      matched = IB_CONFIG.levels[3];
    } else {
      matched = IB_CONFIG.levels[4];
    }

    if (levelBadgeDisplay) {
      const isPriority = matched.level <= 2;
      levelBadgeDisplay.innerHTML = `
        <span class="badge ${isPriority ? 'bg-warning text-dark' : 'bg-primary'} px-3 py-2 rounded-pill">
          Level ${matched.level}: ${matched.name} ${isPriority ? '★ Priority' : ''}
        </span>`;
    }

    if (levelDescDisplay) {
      levelDescDisplay.textContent = matched.desc;
    }

    // Highlight matching level card slightly if visible
    document.querySelectorAll("[data-level-card]").forEach(card => {
      const lvl = parseInt(card.getAttribute("data-level-card"), 10);
      if (lvl === matched.level) {
        card.style.borderColor = "var(--brand)";
        card.style.boxShadow = "0 14px 30px -8px rgba(22, 82, 214, 0.28)";
      } else {
        card.style.borderColor = "";
        card.style.boxShadow = "";
      }
    });
  };

  if (scoreInput) {
    const paintSlider = (val) => {
      scoreInput.style.background = `linear-gradient(to right, var(--brand) ${val}%, var(--line) ${val}%)`;
    };
    scoreInput.addEventListener("input", (e) => {
      const val = parseInt(e.target.value, 10);
      paintSlider(val);
      updateEstimator(val);
    });
    paintSlider(parseInt(scoreInput.value, 10));
    updateEstimator(parseInt(scoreInput.value, 10));
  }

  /* ---------- 5. Navbar scroll, Back-to-top & Mobile Sticky Bar ---------- */
  const nav = document.getElementById("ibNav");
  const toTop = document.getElementById("toTop");
  const mobileStickyBar = document.getElementById("mobileStickyBar");

  let lastScrollY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    if (nav) {
      nav.classList.toggle("scrolled", y > 20);
      if (y < 260 || y < lastScrollY - 4) nav.classList.remove("nav-hidden");
      else if (y > 260 && y > lastScrollY + 4) nav.classList.add("nav-hidden");
    }
    if (toTop) toTop.classList.toggle("show", y > 450);
    if (mobileStickyBar) mobileStickyBar.classList.toggle("visible", y > 400);
    lastScrollY = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 6. Close mobile menu after clicking a link ---------- */
  const menu = document.getElementById("ibMenu");
  document.querySelectorAll("#ibMenu .nav-link, #ibMenu .dropdown-item, #ibMenu .btn").forEach(link => {
    link.addEventListener("click", () => {
      if (menu && menu.classList.contains("show")) {
        bootstrap.Collapse.getOrCreateInstance(menu).hide();
      }
    });
  });

  /* ---------- 7. Highlight the section currently in viewport ---------- */
  const sections = document.querySelectorAll("section[id], header[id]");
  const navLinks = document.querySelectorAll('#ibMenu .nav-link[href^="#"]');

  if (sections.length && navLinks.length) {
    const updateCurrentSection = () => {
      const marker = (nav?.getBoundingClientRect().height || 84) + 20;
      const visibleSections = [...sections]
        .filter(section => [...navLinks].some(link => link.getAttribute("href") === `#${section.id}`))
        .filter(section => {
          const bounds = section.getBoundingClientRect();
          return bounds.top <= marker && bounds.bottom > marker;
        })
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
      const current = visibleSections[visibleSections.length - 1];
      navLinks.forEach(link => {
        link.classList.toggle("active", Boolean(current && link.getAttribute("href") === `#${current.id}`));
      });
    };
    window.addEventListener("scroll", updateCurrentSection, { passive: true });
    window.addEventListener("resize", updateCurrentSection, { passive: true });
    updateCurrentSection();
  }

  /* ---------- 8. Animate stat numbers on scroll once ---------- */
  const formatNum = n => {
    if (n >= 100000) return (n / 100000).toFixed(1).replace(/\.0$/, "") + " Lacs+";
    if (n >= 1000) return Math.round(n).toLocaleString("en-IN") + "+";
    return Math.round(n) + "+";
  };

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const runCount = el => {
    const target = parseInt(el.dataset.count, 10);
    const suffix = el.dataset.suffix || "";

    if (reduceMotion) {
      el.textContent = suffix ? target + suffix : formatNum(target);
      return;
    }

    const duration = 1500;
    const start = performance.now();

    const tick = now => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = target * eased;
      el.textContent = suffix ? Math.round(value) + suffix : formatNum(value);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const stats = document.querySelectorAll(".stat-num[data-count]");
  if ("IntersectionObserver" in window && stats.length) {
    const statObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          runCount(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    stats.forEach(s => statObserver.observe(s));
  } else {
    stats.forEach(runCount);
  }

  /* ---------- 9. Dynamic copyright year in footer ---------- */
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- 10. Flow bridge pill scrolls to Step 4 ---------- */
  const bridgePill = document.querySelector(".flow-bridge-pill");
  if (bridgePill) {
    bridgePill.style.cursor = "pointer";
    bridgePill.addEventListener("click", () => {
      const step4 = document.querySelector('[data-flow-step="4"]');
      if (step4) step4.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  //   /* ---------- 11. Expand / Collapse all FAQs ---------- */
  //   const faqBox = document.getElementById("faqBox");
  //   if (faqBox) {
  //     const toggleBtn = document.createElement("button");
  //     toggleBtn.type = "button";
  //     // toggleBtn.className = "btn btn-ib-ghost btn-sm faq-expand-all mb-3";
  //     toggleBtn.innerHTML = `<i class="bi bi-arrows-expand"></i> <span>Expand all</span>`;
  //     faqBox.parentElement.insertBefore(toggleBtn, faqBox);

  //     let expanded = false;
  //     toggleBtn.addEventListener("click", () => {
  //       expanded = !expanded;
  //       faqBox.querySelectorAll(".accordion-collapse").forEach(panel => {
  //         bootstrap.Collapse.getOrCreateInstance(panel, { toggle: false })[expanded ? "show" : "hide"]();
  //       });
  //       toggleBtn.querySelector("span").textContent = expanded ? "Collapse all" : "Expand all";
  //     });
  //   }

  /* ---------- 12. FAQ Hover-to-Open / Hover-away-to-Close ---------- */
  (function () {
    const faqBox = document.getElementById("faqBox");
    if (!faqBox) return;

    const faqItems = faqBox.querySelectorAll(".accordion-item");
    let hoverTimer = null;
    let currentOpen = null;

    faqItems.forEach(item => {
      const collapseEl = item.querySelector(".accordion-collapse");
      if (!collapseEl) return;

      item.addEventListener("mouseenter", () => {
        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
          // Close the previously opened item
          if (currentOpen && currentOpen !== collapseEl) {
            const prevInstance = bootstrap.Collapse.getInstance(currentOpen);
            if (prevInstance) prevInstance.hide();
          }
          // Open this item if not already open
          if (!collapseEl.classList.contains("show")) {
            let instance = bootstrap.Collapse.getInstance(collapseEl);
            if (!instance) instance = new bootstrap.Collapse(collapseEl, { toggle: false });
            instance.show();
          }
          currentOpen = collapseEl;
        }, 120); // 120ms hover intent delay
      });

      item.addEventListener("mouseleave", () => {
        clearTimeout(hoverTimer);
      });
    });

    // Close when cursor fully leaves the accordion
    faqBox.addEventListener("mouseleave", () => {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        if (currentOpen) {
          const instance = bootstrap.Collapse.getInstance(currentOpen);
          if (instance) instance.hide();
          currentOpen = null;
        }
      }, 200);
    });
  })();

  /* ---------- 13. Pattern Deck — Stacked → Spread on Hover ---------- */
  (function () {
    const wrap = document.getElementById("patternDeckWrap");
    const deck = document.getElementById("patternDeck");
    if (!wrap || !deck) return;

    /* spread-on-hover removed: it moved cards out from under the cursor; hover now links to the donut (landing-polish.js) */
  })();

  /* ============================================================
     Assessment Gauge — Hero Right-Side Interactive Widget
     ============================================================ */
  (function () {
    /* Hero preview mirrors the five outcomes shown in the career pathway. */
    var LEVELS = [
      { label: 'Top / Excellent',    outcome: '10+ LPA',                 outcomeLabel: 'Package opportunities', lvlTxt: 'Level 1', icon: 'trophy-fill',      iconColor: '#ff8a1e' },
      { label: 'Intermediate',       outcome: '5–10 LPA',                outcomeLabel: 'Package opportunities', lvlTxt: 'Level 2', icon: 'star-fill',        iconColor: '#f59e0b' },
      { label: 'Basic / Employable', outcome: 'Up to 5 LPA',             outcomeLabel: 'Package opportunities', lvlTxt: 'Level 3', icon: 'patch-check-fill', iconColor: '#1652d6' },
      { label: 'Basic Knowledge',    outcome: 'Paid internship',          outcomeLabel: 'Next opportunity',     lvlTxt: 'Level 4', icon: 'book-half',        iconColor: '#6366f1' },
      { label: 'Needs Training',     outcome: 'Training → internship',    outcomeLabel: 'Next opportunity',     lvlTxt: 'Level 5', icon: 'pencil-fill',      iconColor: '#94a3b8' }
    ];

    var ring     = document.getElementById('gaugeRing');
    var pctEl    = document.getElementById('gaugePct');
    var labelEl  = document.getElementById('gaugeLabel');
    var lvlEl    = document.getElementById('gaugeLvl');
    var rangeEl  = document.getElementById('gaugeRange');
    var trophyEl = document.getElementById('gaugeTrophy');
    var btns     = document.querySelectorAll('.gauge-lvl-btn');

    if (!ring || !btns.length) return;

    /* ---- activate a level ---- */
    function activate(idx) {
      var lvl    = LEVELS[idx];
      ring.style.strokeDashoffset = 0;
      pctEl.textContent = lvl.outcome;

      labelEl.textContent  = lvl.label;
      lvlEl.textContent    = lvl.lvlTxt;
      rangeEl.innerHTML    = '<i class="bi bi-briefcase-fill"></i> ' + lvl.outcomeLabel + ' · ' + lvl.outcome;

      trophyEl.className   = 'bi bi-' + lvl.icon + ' gauge-center-trophy';
      trophyEl.style.color = lvl.iconColor;

      btns.forEach(function (btn, i) {
        btn.classList.remove('active', 'faded');
        btn.setAttribute('aria-pressed', i === idx ? 'true' : 'false');
        if (i !== idx) btn.classList.add('faded');
      });
      btns[idx].classList.add('active');
      btns[idx].classList.remove('faded');
    }

    /* ---- wire hover + click ---- */
    btns.forEach(function (btn) {
      var idx = parseInt(btn.getAttribute('data-lvl'), 10);
      btn.addEventListener('mouseenter', function () { activate(idx); });
      btn.addEventListener('click',      function () { activate(idx); });
    });

    /* reset to Level 1 when mouse leaves the gauge visual */
    var gaugeStage = document.querySelector('.gauge-stage') || document.querySelector('.gauge-card');
    if (gaugeStage) {
      gaugeStage.addEventListener('mouseleave', function () { activate(0); });
    }

    /* default state */
    activate(0);
  })();

});
