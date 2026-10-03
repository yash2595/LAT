import os

os.makedirs('assets/recruiters', exist_ok=True)

svg_template = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 120">
  <rect width="200" height="120" fill="transparent"/>
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="{size}" fill="#0f172a" letter-spacing="-1">{name}</text>
  <path d="M 85 85 L 115 85" stroke="#1d4ed8" stroke-width="3" stroke-linecap="round" opacity="0.8" />
</svg>"""

companies = {
    'ibm': ('IBM', 50),
    'oracle': ('ORACLE', 32),
    'tcs': ('TCS', 50),
    'cognizant': ('Cognizant', 28),
    'wipro': ('Wipro', 40),
    'hgs-cx': ('HGS', 50),
    'niit': ('NIIT', 50),
    'aicte': ('AICTE', 40),
    'genpact': ('Genpact', 34),
    'infosys': ('Infosys', 34),
    'bajaj': ('BAJAJ', 34),
    'aif': ('AIF', 50),
    'niit-foundation': ('NIIT', 44),
    'dsci': ('DSCI', 44),
    'punjab-govt': ('Punjab', 34),
    'ap-sche': ('AP SCHE', 28)
}

for key, val in companies.items():
    with open(f'assets/recruiters/{key}.svg', 'w') as f:
        # A tiny adjustment: only add the blue underline for aesthetic consistency
        f.write(svg_template.format(name=val[0], size=val[1]))
print("Clean SVGs created!")
