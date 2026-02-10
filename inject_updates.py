import os
import re

def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(path, content):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def inject_updates():
    html_path = 'gotrange.html'
    if not os.path.exists(html_path):
        print("gotrange.html not found!")
        return

    html = read_file(html_path)

    # 1. Inject CSS
    css_content = read_file('css/style.css')
    # Regex to find <style>...</style>
    # We look for the main style block which starts with @import or typical CSS
    # gotrange.html has <style>@import...
    # We use a pattern that ensures we are capturing the main style block
    pattern_css = r'<style>.*?</style>'

    # Check if we find it
    if re.search(pattern_css, html, re.DOTALL):
        html = re.sub(pattern_css, f'<style>\n{css_content}\n</style>', html, count=1, flags=re.DOTALL)
        print("Injected CSS.")
    else:
        print("Warning: CSS <style> block not found.")

    # 2. Inject JS Input
    js_input = read_file('js/input.js')
    # Look for script block with GamepadController
    # We allow some whitespace flexibility
    pattern_input = r'<script>\s*const GamepadController = \{.*?</script>'
    if re.search(pattern_input, html, re.DOTALL):
        html = re.sub(pattern_input, f'<script>\n{js_input}\n</script>', html, count=1, flags=re.DOTALL)
        print("Injected js/input.js")
    else:
        print("Warning: GamepadController script block not found.")

    # 3. Inject JS Game
    js_game = read_file('js/game.js')
    # Look for script block with High Score Logic
    pattern_game = r'<script>\s*// --- HIGH SCORE LOGIC ---.*?</script>'
    if re.search(pattern_game, html, re.DOTALL):
        # Note: js/game.js content we read is the replacement.
        # We replace the entire block from <script> to </script>
        html = re.sub(pattern_game, f'<script>\n{js_game}\n</script>', html, count=1, flags=re.DOTALL)
        print("Injected js/game.js")
    else:
        print("Warning: Game logic script block not found.")

    # 4. Inject Button Prompts HTML
    if 'id="gamepad-prompts"' not in html:
        # Inject before </body>
        html = html.replace('</body>', '<div id="gamepad-prompts"></div>\n</body>')
        print("Injected prompts HTML container.")

    write_file(html_path, html)
    print("Updated gotrange.html")

    # Update taco_app/www/index.html if exists
    target_path = 'taco_app/www/index.html'
    if os.path.exists(os.path.dirname(target_path)):
        # Just copy the updated html there? Or rely on migrate.js?
        # The prompt says "Inject Updates: Use a python script to inject... into ... taco_app/www/index.html"
        # So we should update it too.
        # We can just write the modified html string to it.
        # But wait, migrate.js does Cordova injections. If we overwrite, we lose Cordova injections?
        # migrate.js reads gotrange.html, adds cordova stuff, writes to index.html.
        # So it's safer to RUN migrate.js logic (or python equivalent) or just write to gotrange.html and assume user/build process handles the rest?
        # The memory says "Inject ... into gotrange.html and taco_app/www/index.html".
        # If I write to index.html, I should probably respect the cordova injections.
        # But for this task (controller support), the changes are in JS/CSS/HTML-body.
        # If I overwrite index.html with gotrange.html content, I might break Cordova if I don't re-inject cordova.js.
        # Let's see if we can just trigger migrate.js? No, I can't run node scripts easily if dependencies missing?
        # Actually I can run `node migrate.js` via bash.
        # So I will just update gotrange.html here, and then run `node migrate.js` in bash step.
        pass

if __name__ == "__main__":
    inject_updates()
