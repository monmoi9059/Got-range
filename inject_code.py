import re
import os

def read_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(filepath, content):
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def extract_skins_db(js_content):
    match = re.search(r'(var SKINS_DB = \[.*?\];)', js_content, re.DOTALL)
    if match:
        return match.group(1)
    return None

def update_html_file(html_path, skins_data, renderer_code):
    content = read_file(html_path)

    # 1. Update SKINS_DB
    if skins_data:
        pattern_skins = r'var SKINS_DB = \[.*?\];'
        if re.search(pattern_skins, content, re.DOTALL):
            content = re.sub(pattern_skins, skins_data, content, flags=re.DOTALL)
            print(f"Updated SKINS_DB in {html_path}")
        else:
            print(f"Warning: SKINS_DB not found in {html_path}")

    # 2. Update Renderer Logic
    # We replace from `var BallRenderer = {` up to end of `drawSplitscreenHUD` function.
    start_marker = "var BallRenderer = {"
    end_marker_signature = "function drawSplitscreenHUD() {"

    start_idx = content.find(start_marker)
    hud_start_idx = content.find(end_marker_signature)

    if start_idx != -1 and hud_start_idx != -1:
        # Find end of drawSplitscreenHUD in HTML
        # Stop if we hit </script> to avoid eating next block if braces are unbalanced
        open_braces = 0
        end_idx = -1
        script_end_idx = content.find("</script>", hud_start_idx)

        for i in range(hud_start_idx, len(content)):
            # Safety check: Don't cross into next script block
            if script_end_idx != -1 and i >= script_end_idx:
                print(f"Warning: Reached </script> before closing brace in {html_path}. Using script end as boundary.")
                # We assume the block ends at the last char before </script>
                # But we usually want to include the closing brace if we are replacing.
                # If the file is broken (missing brace), we replace up to start of </script>
                # effectively replacing the broken code with valid code.
                end_idx = script_end_idx
                break

            if content[i] == '{':
                open_braces += 1
            elif content[i] == '}':
                open_braces -= 1
                if open_braces == 0:
                    end_idx = i + 1
                    break

        if end_idx != -1:
            # If we hit script tag, ensure we don't duplicate newlines too much, but renderer.js code is complete.
            # js/renderer.js ends with the function. content[end_idx] is </script> or next char.

            # If we stopped at </script>, end_idx points to `<`.
            # content[:start_idx] + renderer_code + content[end_idx:]

            new_content = content[:start_idx] + renderer_code + "\n\n" + content[end_idx:]
            write_file(html_path, new_content)
            print(f"Updated Renderer logic in {html_path}")
        else:
            print(f"Error: Could not parse end of drawSplitscreenHUD in {html_path}")
    else:
        print(f"Error: Renderer markers not found in {html_path} (Start: {start_idx}, End: {hud_start_idx})")

def main():
    skins_js = read_file('js/data.js')
    renderer_js = read_file('js/renderer.js')
    skins_data = extract_skins_db(skins_js)

    html_files = ['gotrange.html', 'taco_app/www/index.html']

    for html in html_files:
        if os.path.exists(html):
            update_html_file(html, skins_data, renderer_js)
        else:
            print(f"Skipping {html} (not found)")

if __name__ == "__main__":
    main()
