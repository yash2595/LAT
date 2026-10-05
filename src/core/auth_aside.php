<?php /* Shared brand panel + icon sprite for login/register. Expects $asideTitle, $asideLead */ ?>
<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<symbol id="i-mail" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></symbol>
<symbol id="i-lock" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></symbol>
<symbol id="i-user" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></symbol>
<symbol id="i-phone" viewBox="0 0 24 24"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></symbol>
<symbol id="i-eye" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></symbol>
<symbol id="i-eyeoff" viewBox="0 0 24 24"><path d="M17.9 17.9A10 10 0 0 1 12 20C5 20 1 12 1 12a18 18 0 0 1 5-6M9.9 4.2A9 9 0 0 1 12 4c7 0 11 8 11 8a18 18 0 0 1-2.2 3.2M1 1l22 22"/></symbol>
<symbol id="i-key" viewBox="0 0 24 24"><circle cx="8" cy="15" r="4"/><path d="m11 12 9-9M16 7l3 3"/></symbol>
<symbol id="i-check" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></symbol>
</defs></svg>
<aside class="aside">
  <div class="chip"><img src="/assets/css/internboot-official-logo.webp" alt="InternBoot"></div>
  <div>
    <h1><?= htmlspecialchars($asideTitle) ?></h1>
    <p class="lead"><?= htmlspecialchars($asideLead) ?></p>
    <div class="stairs" aria-hidden="true">
      <span class="st" style="--n:0">L1</span><span class="st" style="--n:1">L2</span><span class="st" style="--n:2">L3</span><span class="st" style="--n:3">L4</span><span class="st apex" style="--n:4">L5</span>
      <i class="climber"></i>
      <div class="gc g1"><svg class="ico"><use href="#i-check"/></svg>Level 3 cleared</div>
      <div class="gc g2"><svg class="ico"><use href="#i-check"/></svg>Certificate verified</div>
    </div>
  </div>
  <div class="stats">
    <div><b>10,000+</b><span>Students</span></div>
    <div><b>500+</b><span>Companies</span></div>
    <div><b>4.9/5</b><span>Rating</span></div>
  </div>
</aside>