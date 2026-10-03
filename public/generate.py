import sys
import os

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find boundaries
idx_hero = content.find('<section class="hero" id="top">')
header_part = content[:idx_hero]

idx_faq = content.find('<section id="faq" class="sec">')
idx_faq_end = content.find('</section>', idx_faq) + len('</section>')
faq_part = content[idx_faq:idx_faq_end]

idx_contact = content.find('<section id="contact" class="sec">')
idx_contact_end = content.find('</section>', idx_contact) + len('</section>')
contact_part = content[idx_contact:idx_contact_end]

idx_final = content.find('<section id="final" class="sec">')
final_part = content[idx_final:]

# Replace links in header and footer
def fix_links(text):
    text = text.replace('href="#faq"', 'href="faq.html"')
    text = text.replace('href="#contact"', 'href="contact.html"')
    text = text.replace('href="mailto:support@internboot.com"', 'href="contact.html"')
    return text

header_part = fix_links(header_part)

# Remove all scripts from final part to avoid errors on the new pages
idx_script = final_part.find('<script>')
if idx_script != -1:
    final_part_no_js = final_part[:idx_script] + '</body>\n</html>'
else:
    final_part_no_js = final_part

final_part_no_js = fix_links(final_part_no_js)
faq_part = fix_links(faq_part)
contact_part = fix_links(contact_part)

contact_script = """
  <script>
    const $ = (s, r = document) => r.querySelector(s);
    if ($("#contactForm")) {
        $("#contactForm").onsubmit = async (e) => {
          e.preventDefault();
          const f = e.target,
            m = $("#cs"),
            b = f.querySelector("button");
          b.disabled = true;
          b.textContent = "Sending…";
          m.className = "";
          m.textContent = "";
          try {
            const r = await fetch(f.action, {
              method: "POST",
              body: new FormData(f),
            });
            m.className = r.ok ? "ok" : "err";
            m.textContent = r.ok
              ? "Thanks! We will reply soon."
              : "Could not send. Email info@internboot.com.";
            r.ok && f.reset();
          } catch (_) {
            m.className = "err";
            m.textContent = "Could not send. Email info@internboot.com.";
          }
          b.disabled = false;
          b.textContent = "Send message →";
        };
    }
  </script>
</body>
</html>
"""

with open('faq.html', 'w', encoding='utf-8') as f:
    f.write(header_part + faq_part + final_part_no_js)

with open('contact.html', 'w', encoding='utf-8') as f:
    # Need to remove </body></html> from final_part_no_js and append contact_script
    f.write(header_part + contact_part + final_part_no_js.replace('</body>\n</html>', '') + contact_script)

print('Generated faq.html and contact.html')
