import glob

files = glob.glob('public/*.html')

for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    blogs_count = content.count('href="blogs.html')
    ref_count = content.count('href="references.html')
    old_ref_count = content.count('href="reference.html')
    
    print(f'{f:30} blogs={blogs_count}, refs={ref_count}, old_refs={old_ref_count}')
