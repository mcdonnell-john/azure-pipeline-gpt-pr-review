const fs = require('fs');

// Load package.json
const pkg = JSON.parse(fs.readFileSync('./GPTPullRequestReview/package.json', 'utf8'));

// --- Update vss-extension.json ---
const extPath = 'vss-extension.json';
const ext = JSON.parse(fs.readFileSync('vss-extension.json', 'utf8'));
ext.version = pkg.version;
fs.writeFileSync(extPath, JSON.stringify(ext, null, 2));
console.log(`✅ vss-extension.json version set to ${pkg.version}`);

// --- Update task.json patch version ---
const taskPath = JSON.parse(fs.readFileSync('./GPTPullRequestReview/task.json', 'utf8'));
const task = JSON.parse(fs.readFileSync(taskPath, 'utf8'));

const [major, minor, patch] = task.version;
task.version = [major, minor, patch + 1];

fs.writeFileSync(taskPath, JSON.stringify(task, null, 2));
console.log(`✅ task.json patch version bumped to ${task.version.join('.')}`);