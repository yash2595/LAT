import glob
import re

files = glob.glob('public/*.html')

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    orig = content
    
    # 1. First, remove any References or Reference links to avoid duplicates
    content = re.sub(r'<a href="references\.html"(?: aria-current="page")?>References</a>', '', content)
    content = re.sub(r'<a href="reference\.html"(?: aria-current="page")?>Reference</a>', '', content)
    
    # 2. Insert References link after Blogs.
    # If the file is references.html, it gets aria-current="page"
    ref_link = '<a href="references.html" aria-current="page">References</a>' if f.endswith('references.html') else '<a href="references.html">References</a>'
    
    # Blogs could be with or without aria-current
    # We find <a href="blogs.html" ...>Blogs</a>
    content = re.sub(r'(<a href="blogs\.html"(?: aria-current="page")?>Blogs</a>)', r'\1' + ref_link, content)
    
    # If there is no Blogs link in this file (like references.html before I add it?),
    if 'blogs.html' not in content:
        # Insert Blogs and References after Achievements
        blogs_link = '<a href="blogs.html">Blogs</a>'
        content = re.sub(r'(<a href="achievements\.html"(?: aria-current="page")?>Achievements</a>)', r'\1' + blogs_link + ref_link, content)
    
    if content != orig:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(content)
        print('Updated', f)
