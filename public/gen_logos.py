import os

os.makedirs('assets/recruiters', exist_ok=True)

svg_template = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 163 120">
  <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="'Arial Black', Impact, sans-serif" font-weight="bold" font-size="{size}" fill="{color}">{name}</text>
</svg>'''

companies = {
    'ibm': ('IBM', '#0530ad', 50),
    'oracle': ('ORACLE', '#c74634', 35),
    'tcs': ('TCS', '#1675c9', 50),
    'cognizant': ('Cognizant', '#000048', 25),
    'wipro': ('wipro', '#000', 40),
    'hgs-cx': ('HGS', '#ff6600', 50),
    'niit': ('NIIT', '#000', 50),
    'aicte': ('AICTE', '#ff9900', 40),
    'genpact': ('genpact', '#000', 30),
    'infosys': ('Infosys', '#007cc3', 35),
    'bajaj': ('BAJAJ', '#005bac', 35),
    'aif': ('AIF', '#000', 50),
    'niit-foundation': ('NIIT', '#000', 40),
    'dsci': ('DSCI', '#1675c9', 40),
    'punjab-govt': ('Punjab', '#000', 35),
    'ap-sche': ('AP SCHE', '#000', 30)
}

for key, val in companies.items():
    with open(f'assets/recruiters/{key}.svg', 'w') as f:
        f.write(svg_template.format(name=val[0], color=val[1], size=val[2]))
print('Created SVGs')
