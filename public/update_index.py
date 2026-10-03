import sys

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace links in header and footer
content = content.replace('href="#faq"', 'href="faq.html"')
content = content.replace('href="#contact"', 'href="contact.html"')
content = content.replace('href="mailto:support@internboot.com"', 'href="contact.html"')

# Remove FAQ section
idx_faq = content.find('<section id="faq" class="sec">')
if idx_faq != -1:
    idx_faq_end = content.find('</section>', idx_faq) + len('</section>')
    content = content[:idx_faq] + content[idx_faq_end:]

# Remove Contact section
idx_contact = content.find('<section id="contact" class="sec">')
if idx_contact != -1:
    idx_contact_end = content.find('</section>', idx_contact) + len('</section>')
    content = content[:idx_contact] + content[idx_contact_end:]

# Remove from SC array
# ["faq", "FAQs"],
# ["contact", "Contact"],
content = content.replace('      ["faq", "FAQs"],\n', '')
content = content.replace('      ["contact", "Contact"],\n', '')

# Just to be safe, maybe it doesn't have exactly those spaces:
import re
content = re.sub(r'\s*\["faq", "FAQs"\],', '', content)
content = re.sub(r'\s*\["contact", "Contact"\],', '', content)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated index.html")
