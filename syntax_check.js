const fs = require('fs');
const vm = require('vm');

function check(file) {
    try {
        const code = fs.readFileSync(file, 'utf8');
        new vm.Script(code);
        console.log(file + ': Syntax OK');
    } catch (e) {
        console.error(file + ': Syntax Error');
        console.error(e);
        process.exit(1);
    }
}

check('js/data.js');
check('js/renderer.js');
