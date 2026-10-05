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
</defs></svg>
<aside class="aside" data-variant="<?= htmlspecialchars($asideVariant) ?>">
  <a class="chip" href="/index.html" aria-label="InternBoot home"><img src="/assets/css/internboot-official-logo.webp" alt="InternBoot"></a>
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
      <!-- Premium 3D Floating Offer Letters -->
      <style>
        .offer-card {
          position: absolute;
          width: 220px;
          background: rgba(15, 23, 42, 0.4);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          padding: 16px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 30px 60px -10px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.2);
          z-index: 10;
        }
        .offer-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 16px;
          padding: 1px;
          background: linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
        }
        .oc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .oc-icon { width: 38px; height: 38px; border-radius: 10px; display: grid; place-items: center; }
        .oc-icon.blue { background: linear-gradient(135deg, #3b82f6, #6366f1); box-shadow: 0 4px 15px rgba(59,130,246,0.4); }
        .oc-icon.emerald { background: linear-gradient(135deg, #10b981, #059669); box-shadow: 0 4px 15px rgba(16,185,129,0.4); }
        .oc-status { text-align: right; }
        .oc-status span { display: block; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #94a3b8; font-weight: 800; margin-bottom: 2px; }
        .oc-status strong { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 10px; font-weight: 800; background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .oc-body h4 { margin: 0 0 4px; font-size: 15px; color: #fff; font-weight: 800; letter-spacing: -0.02em; }
        .oc-body p { margin: 0 0 12px; font-size: 12px; color: #cbd5e1; font-weight: 500; display: flex; align-items: center; gap: 4px; }
        .oc-line { height: 1px; background: rgba(255, 255, 255, 0.1); margin-bottom: 12px; }
        .oc-footer { display: flex; gap: 8px; }
        .oc-btn { flex: 1; height: 32px; border-radius: 8px; display: grid; place-items: center; font-size: 12px; font-weight: 700; color: #fff; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255,255,255,0.05); }
        .oc-btn.primary { background: #fff; color: #0f172a; box-shadow: 0 4px 10px rgba(255,255,255,0.2); }
        
        @keyframes float-right {
          0%, 100% { transform: translateY(0) rotate(6deg) scale(0.9); }
          50% { transform: translateY(-15px) rotate(4deg) scale(0.9); }
        }
        @keyframes float-left {
          0%, 100% { transform: translateY(0) rotate(-5deg) scale(0.85); }
          50% { transform: translateY(-12px) rotate(-7deg) scale(0.85); }
        }
      </style>

      <div class="offer-card" style="top: -10px; right: -50px; animation: float-right 6s ease-in-out infinite;">
        <div class="oc-header">
          <div class="oc-icon blue">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          </div>
          <div class="oc-status">
            <span>Level 5 Cleared</span>
            <strong>OFFERED</strong>
          </div>
        </div>
        <div class="oc-body">
          <h4>Software Engineer</h4>
          <p><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> Bangalore · ₹15 LPA</p>
        </div>
        <div class="oc-line"></div>
        <div class="oc-footer">
          <div class="oc-btn">Decline</div>
          <div class="oc-btn primary">Accept Offer</div>
        </div>
      </div>

      <div class="offer-card" style="bottom: 80px; left: -60px; animation: float-left 7s ease-in-out infinite reverse;">
        <div class="oc-header">
          <div class="oc-icon emerald">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          </div>
          <div class="oc-status">
            <span>Level 5 Cleared</span>
            <strong>OFFERED</strong>
          </div>
        </div>
        <div class="oc-body">
          <h4>Data Analyst</h4>
          <p><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> Remote · ₹12 LPA</p>
        </div>
        <div class="oc-line"></div>
        <div class="oc-footer">
          <div class="oc-btn">Decline</div>
          <div class="oc-btn primary">Accept Offer</div>
        </div>
      </div>
    </div>
  </div>
  <div class="stats"><div><b>10,000+</b><span>Students</span></div><div><b>500+</b><span>Companies</span></div><div><b>4.9/5</b><span>Rating</span></div></div>
</aside>