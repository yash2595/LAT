import os
import re
import glob

nav_pattern = re.compile(r'(\s*)\.nav\s*\{.*?(?:\.btn:hover\s*\{[^\}]*\})', re.DOTALL)

pill_css = """{indent}.nav {{
{indent}  position: sticky;
{indent}  top: 10px;
{indent}  z-index: 50;
{indent}  display: flex;
{indent}  align-items: center;
{indent}  gap: 16px;
{indent}  height: 56px;
{indent}  width: min(1040px, calc(100% - 32px));
{indent}  margin: 10px auto -66px;
{indent}  padding: 0 8px 0 22px;
{indent}  border-radius: 999px;
{indent}  background: rgba(255, 255, 255, 0.72);
{indent}  -webkit-backdrop-filter: blur(18px) saturate(160%);
{indent}  backdrop-filter: blur(18px) saturate(160%);
{indent}  border: 1px solid rgba(255, 255, 255, 0.55);
{indent}  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.16);
{indent}}}

{indent}.nav>a:first-child img {{
{indent}  display: block;
{indent}  height: 28px;
{indent}}}

{indent}.nav nav {{
{indent}  margin-left: auto;
{indent}  display: flex;
{indent}  align-items: center;
{indent}  gap: clamp(10px, 1.4vw, 20px);
{indent}}}

{indent}.nav nav a {{
{indent}  position: relative;
{indent}  color: var(--ink);
{indent}  text-decoration: none;
{indent}  font-weight: 700;
{indent}  font-size: clamp(12px, 1.05vw, 13.5px);
{indent}  white-space: nowrap;
{indent}}}

{indent}.nav nav a:hover,
{indent}.nav nav a[aria-current] {{
{indent}  color: var(--bl);
{indent}}}

{indent}.nav nav a[aria-current]::after {{
{indent}  content: "";
{indent}  position: absolute;
{indent}  left: 50%;
{indent}  bottom: -7px;
{indent}  width: 5px;
{indent}  height: 5px;
{indent}  margin-left: -2.5px;
{indent}  border-radius: 50%;
{indent}  background: var(--bl);
{indent}}}

{indent}.btn {{
{indent}  display: inline-block;
{indent}  background: var(--bl);
{indent}  color: #fff;
{indent}  font-weight: 800;
{indent}  text-decoration: none;
{indent}  padding: 10px 18px;
{indent}  border-radius: 12px;
{indent}  box-shadow: 0 8px 22px #1d4ed84d;
{indent}  transition:
{indent}    transform 0.2s,
{indent}    box-shadow 0.2s;
{indent}}}

{indent}.btn:hover {{
{indent}  transform: translateY(-2px);
{indent}  box-shadow: 0 12px 28px #1d4ed870;
{indent}}}

{indent}.nav>.btn {{
{indent}  padding: 8px 16px;
{indent}  font-size: 13.5px;
{indent}  border-radius: 999px;
{indent}  box-shadow: 0 6px 16px #1d4ed84d;
{indent}}}"""

for file in glob.glob('*.html'):
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    def repl(m):
        indent = m.group(1)
        if "border-radius: 999px;" in m.group(0):
            return m.group(0)
        return pill_css.format(indent=indent)
    
    new_content = nav_pattern.sub(repl, content, count=1)
    
    if new_content != content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated {file}")
