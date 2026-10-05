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
      <div class="gc g-lvl"><svg class="ico"><use href="#i-check"/></svg>Level 3 cleared</div>
      <div class="gc g-cert"><svg class="ico"><use href="#i-shield"/></svg>Certificate verified</div>
    </div>
  </div>
  <div class="stats"><div><b>10,000+</b><span>Students</span></div><div><b>500+</b><span>Companies</span></div><div><b>4.9/5</b><span>Rating</span></div></div>
</aside>