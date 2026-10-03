import os

os.makedirs('assets/recruiters', exist_ok=True)

svg_template = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120">
  <defs>
    <linearGradient id="grad_{id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{color1}" stop-opacity="0.12" />
      <stop offset="100%" stop-color="{color2}" stop-opacity="0.02" />
    </linearGradient>
    <filter id="glow_{id}" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>
  
  <rect width="200" height="120" fill="url(#grad_{id})"/>
  <!-- subtle grid pattern -->
  <path d="M0 20 h200 M0 40 h200 M0 60 h200 M0 80 h200 M0 100 h200 M20 0 v120 M40 0 v120 M60 0 v120 M80 0 v120 M100 0 v120 M120 0 v120 M140 0 v120 M160 0 v120 M180 0 v120" stroke="{color1}" stroke-width="1" stroke-opacity="0.06" />
  
  <!-- decorative elements -->
  <circle cx="20" cy="20" r="3" fill="{color1}" opacity="0.3" />
  <circle cx="180" cy="100" r="4" fill="{color2}" opacity="0.2" />
  <rect x="160" y="15" width="15" height="4" rx="2" fill="{color1}" opacity="0.2" />
  <rect x="15" y="95" width="8" height="8" rx="2" fill="{color2}" opacity="0.15" />

  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="{size}" fill="{color1}" filter="url(#glow_{id})" letter-spacing="-1">{name}</text>
</svg>"""

companies = {
    'ibm': ('IBM', '#0530ad', '#001d6d', 46),
    'oracle': ('ORACLE', '#c74634', '#7a2215', 30),
    'tcs': ('TCS', '#1675c9', '#0d4a80', 46),
    'cognizant': ('Cognizant', '#000048', '#000020', 26),
    'wipro': ('Wipro', '#333333', '#000000', 36),
    'hgs-cx': ('HGS', '#ff6600', '#a34200', 46),
    'niit': ('NIIT', '#333333', '#000000', 46),
    'aicte': ('AICTE', '#ff9900', '#cc7a00', 36),
    'genpact': ('Genpact', '#333333', '#000000', 32),
    'infosys': ('Infosys', '#007cc3', '#004c7a', 32),
    'bajaj': ('BAJAJ', '#005bac', '#003a6d', 32),
    'aif': ('AIF', '#333333', '#000000', 46),
    'niit-foundation': ('NIIT', '#333333', '#000000', 40),
    'dsci': ('DSCI', '#1675c9', '#0d4a80', 40),
    'punjab-govt': ('Punjab', '#333333', '#000000', 32),
    'ap-sche': ('AP SCHE', '#333333', '#000000', 26)
}

for key, val in companies.items():
    with open(f'assets/recruiters/{key}.svg', 'w') as f:
        f.write(svg_template.format(id=key, name=val[0], color1=val[1], color2=val[2], size=val[3]))
print("200x120 SVGs created!")
