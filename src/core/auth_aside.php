<?php
/*
 * Shared brand panel + icon sprite for login/register.
 * Expects: $asideTitle, $asideLead
 * Optional: $asideVariant = 'login' | 'register'  (default 'login')
 */
$asideVariant = $asideVariant ?? 'login';
?>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<symbol id="i-mail" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></symbol>
<symbol id="i-lock" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></symbol>
<symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></symbol>
<symbol id="i-phone" viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></symbol>
<symbol id="i-eye" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></symbol>
<symbol id="i-eyeoff" viewBox="0 0 24 24"><path d="M17.9 17.9A10 10 0 0 1 12 20C5 20 1 12 1 12a18 18 0 0 1 5-6M9.9 4.2A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.2 3.2M1 1l22 22"/></symbol>
<symbol id="i-key" viewBox="0 0 24 24"><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></symbol>
<symbol id="i-cap" viewBox="0 0 24 24"><path d="M22 9 12 4 2 9l10 5 10-5z"/><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5"/><path d="M22 9v6"/></symbol>
<symbol id="i-shield" viewBox="0 0 24 24"><path d="M12 3 4 6v6c0 4.5 3.2 8 8 9 4.8-1 8-4.5 8-9V6l-8-3z"/><path d="m9 12 2 2 4-4"/></symbol>
<symbol id="i-star" viewBox="0 0 24 24"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z"/></symbol>
<symbol id="i-login-arrow" viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></symbol>
</defs></svg>
<aside class="aside" data-variant="<?= htmlspecialchars($asideVariant) ?>">
  <a class="chip" href="/index.html" aria-label="MyLAT home"><img src="/assets/mylat-logo.png" alt="MyLAT"></a>
  <div class="hero">
    <h1><?= htmlspecialchars($asideTitle) ?></h1>
    <p class="lead"><?= htmlspecialchars($asideLead) ?></p>
    <div class="map" aria-hidden="true">
      <svg class="trail" viewBox="0 0 460 300" fill="none">
        <path class="trail-base" d="M30 262 C140 262 110 186 205 186 S300 112 352 112 S408 44 432 40"/>
        <path class="trail-glow" d="M30 262 C140 262 110 186 205 186 S300 112 352 112 S408 44 432 40" pathLength="100"/>
      </svg>
      <div class="nd" style="--i:0"><b>1</b><em>Foundation</em></div>
      <div class="nd" style="--i:1"><b>2</b><em>Core skills</em></div>
      <div class="nd" style="--i:2"><b>3</b><em>Applied</em></div>
      <div class="nd" style="--i:3"><b>4</b><em>Advanced</em></div>
      <div class="nd apex" style="--i:4"><b><svg class="ico"><use href="#i-star"/></svg></b><em>Placement ready</em></div>
      <i class="me"></i>
      <!-- Floating Feature Cards (LAT Specific, compact and carefully placed) -->
      <style>
        .feat-card {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(15, 23, 42, 0.5);
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          padding: 10px 14px;
          border-radius: 14px;
          box-shadow: 0 16px 30px -10px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15);
          max-width: 190px;
          z-index: 10;
        }
        .fc-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.05);
          display: grid;
          place-items: center;
          flex-shrink: 0;
          color: #fff;
        }
        .fc-icon svg {
          width: 16px;
          height: 16px;
        }
        .fc-text h4 {
          margin: 0 0 2px;
          font-size: 12px;
          color: #fff;
          font-weight: 800;
        }
        .fc-text p {
          margin: 0;
          font-size: 10.5px;
          color: #94a3b8;
          line-height: 1.3;
          font-weight: 500;
        }
        @keyframes float-l {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes float-r {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      </style>

      <div class="feat-card" style="top: 30px; left: -40px; animation: float-l 6s ease-in-out infinite;">
        <div class="fc-icon"><svg class="ico"><use href="#i-shield"/></svg></div>
        <div class="fc-text">
          <h4>AI-Proctored Exams</h4>
          <p>Secure testing environment</p>
        </div>
      </div>

      <div class="feat-card" style="bottom: -10px; right: -20px; animation: float-r 7s ease-in-out infinite reverse;">
        <div class="fc-icon"><svg class="ico"><use href="#i-star"/></svg></div>
        <div class="fc-text">
          <h4>Direct Placements</h4>
          <p>Get direct interview calls</p>
        </div>
      </div>
    </div>
  </div>
  <div class="stats"><div><b>10,000+</b><span>Students</span></div><div><b>500+</b><span>Companies</span></div><div><b>4.9/5</b><span>Rating</span></div></div>
</aside>