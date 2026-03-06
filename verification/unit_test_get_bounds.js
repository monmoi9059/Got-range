
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Read the source file
const sourcePath = path.join(__dirname, '../js/renderer.js');
const sourceContent = fs.readFileSync(sourcePath, 'utf8');

// Extract getBounds function using regex
// Matches "function getBounds(points) { ... }" assuming it's not nested too complexly
// Or simpler: just find the function block
const getBoundsMatch = sourceContent.match(/function getBounds\(points\) \{[\s\S]*?return \{minX, minY, maxX, maxY\};\s*\}/);

if (!getBoundsMatch) {
    console.error("Could not find getBounds function in js/renderer.js");
    process.exit(1);
}

const getBoundsCode = getBoundsMatch[0];
console.log("Extracted code for testing:");
console.log(getBoundsCode);

// Create a sandbox to execute the function
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(getBoundsCode, sandbox);

const getBounds = sandbox.getBounds;

// Test cases
const testCases = [
    {
        name: "Empty Array",
        points: [],
        expected: {minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity}
    },
    {
        name: "Single Point",
        points: [{x: 10, y: 20}],
        expected: {minX: 10, minY: 20, maxX: 10, maxY: 20}
    },
    {
        name: "Multiple Points (Positive Coordinates)",
        points: [{x: 0, y: 0}, {x: 10, y: 10}, {x: 5, y: 5}],
        expected: {minX: 0, minY: 0, maxX: 10, maxY: 10}
    },
    {
        name: "Multiple Points (Mixed Positive and Negative Coordinates)",
        points: [{x: -5, y: 20}, {x: 15, y: -10}, {x: 0, y: 5}],
        expected: {minX: -5, minY: -10, maxX: 15, maxY: 20}
    },
    {
        name: "Duplicate Points",
        points: [{x: 5, y: 5}, {x: 5, y: 5}],
        expected: {minX: 5, minY: 5, maxX: 5, maxY: 5}
    },
    {
        name: "Horizontal Line",
        points: [{x: 0, y: 5}, {x: 10, y: 5}],
        expected: {minX: 0, minY: 5, maxX: 10, maxY: 5}
    },
    {
        name: "Vertical Line",
        points: [{x: 5, y: 0}, {x: 5, y: 10}],
        expected: {minX: 5, minY: 0, maxX: 5, maxY: 10}
    }
];

let failed = false;

testCases.forEach((caseData, i) => {
    const result = getBounds(caseData.points);
    const success = JSON.stringify(result) === JSON.stringify(caseData.expected);
    if (!success) {
        console.error(`Test Case ${i} ("${caseData.name}") Failed!`);
        console.error(`  Expected: ${JSON.stringify(caseData.expected)}`);
        console.error(`  Got:      ${JSON.stringify(result)}`);
        failed = true;
    } else {
        console.log(`Test Case ${i} ("${caseData.name}") Passed.`);
    }
});

if (failed) {
    process.exit(1);
} else {
    console.log("All Node.js unit tests (from source) passed!");
}
