import os
import re

# Configuration
HTML_FILES = ['gotrange.html', 'taco_app/www/index.html']
JS_DIR = 'js'
CSS_DIR = 'css'

# Order matters for JS execution
JS_ORDER = [
    'geometry.js',
    'data.js',
    'audio.js',
    'renderer.js',
    'game.js',
    'input.js',
    'main.js'
]

def read_file(path):
    if not os.path.exists(path):
        print(f"Warning: File not found: {path}")
        return ""
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def inject():
    # 1. Aggregate JS
    js_content = ""
    for js_file in JS_ORDER:
        path = os.path.join(JS_DIR, js_file)
        print(f"Reading {path}...")
        content = read_file(path)
        js_content += f"\n// --- START {js_file} ---\n"
        js_content += content
        js_content += f"\n// --- END {js_file} ---\n"

    # 2. Aggregate CSS
    css_content = ""
    if os.path.exists(CSS_DIR):
        for css_file in os.listdir(CSS_DIR):
            if css_file.endswith('.css'):
                path = os.path.join(CSS_DIR, css_file)
                print(f"Reading {path}...")
                content = read_file(path)
                css_content += f"\n/* --- START {css_file} --- */\n"
                css_content += content
                css_content += f"\n/* --- END {css_file} --- */\n"

    # 3. Inject into HTML files
    for html_file in HTML_FILES:
        if not os.path.exists(html_file):
            print(f"Skipping {html_file} (not found)")
            continue

        print(f"Processing {html_file}...")
        html = read_file(html_file)

        # Inject CSS
        # Look for markers first
        if '<!-- INJECT_CSS_START -->' in html and '<!-- INJECT_CSS_END -->' in html:
            pattern = re.compile(r'<!-- INJECT_CSS_START -->.*?<!-- INJECT_CSS_END -->', re.DOTALL)
            replacement = f'<!-- INJECT_CSS_START -->\n<style>\n{css_content}\n</style>\n<!-- INJECT_CSS_END -->'
            html = pattern.sub(replacement, html)
        else:
            # Fallback: Replace first <style> block
            print("  Markers not found, using fallback for CSS...")
            # Ideally we want to replace the main style block.
            # But since we are going to add markers in step 2 of the plan, 
            # this script will mostly rely on markers. 
            # However, for the very first run (if I ran it now), it would fail or do nothing.
            # I will ensure I add markers in step 2.
            pass

        # Inject JS
        if '<!-- INJECT_JS_START -->' in html and '<!-- INJECT_JS_END -->' in html:
            pattern = re.compile(r'<!-- INJECT_JS_START -->.*?<!-- INJECT_JS_END -->', re.DOTALL)
            replacement = f'<!-- INJECT_JS_START -->\n<script>\n{js_content}\n</script>\n<!-- INJECT_JS_END -->'
            html = pattern.sub(replacement, html)
        else:
            print("  Markers not found, using fallback for JS...")
            pass

        write_file(html_file, html)
        print(f"Updated {html_file}")

if __name__ == "__main__":
    inject()
