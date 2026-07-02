const assert = require('assert');
const fs = require('fs');

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const readme = fs.readFileSync('README.md', 'utf8').trim();

assert.strictEqual(pkg.name, '141');
assert.strictEqual(pkg.version, '1.0.0');
assert.ok(readme.includes('# 141'), 'README.md should contain the project title');

console.log('All tests passed');
