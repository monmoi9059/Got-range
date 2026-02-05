const fs = require('fs');
try {
    const code = fs.readFileSync('gotrange.html', 'utf8');
    // Simple check: do curly braces balance?
    let open = 0;
    for (let char of code) {
        if (char === '{') open++;
        if (char === '}') open--;
    }
    console.log('Open braces count (should be 0):', open);

    // Look for syntax errors using node
    // We can extract the script content and try to parse it
    const scriptStart = code.indexOf('<script>') + 8;
    const scriptEnd = code.lastIndexOf('</script>');
    if (scriptStart > 8 && scriptEnd > scriptStart) {
        const js = code.substring(scriptStart, scriptEnd);
        fs.writeFileSync('temp_check.js', js);
        console.log('Extracted JS to temp_check.js');
    }
} catch (e) {
    console.error(e);
}
