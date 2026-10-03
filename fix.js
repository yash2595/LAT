const fs = require('fs');
let c = fs.readFileSync('public/index.html', 'utf8');
c = c.replace(/@media\s*\(prefers-reduced-motion:\s*reduce\)/g, '@media (max-width: 1px)');
c = c.replace(/matchMedia\("\(prefers-reduced-motion:reduce\)"\)\.matches/g, 'false');
fs.writeFileSync('public/index.html', c);
