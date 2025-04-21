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
const taskPath = './GPTPullRequestReview/task.json';
const task = JSON.parse(fs.readFileSync(taskPath, 'utf8'));

const { Major, Minor, Patch } = task.version;
task.version = {
    Major,
    Minor,
    Patch: Patch + 1
};

fs.writeFileSync(taskPath, JSON.stringify(task, null, 2));
console.log(`✅ task.json patch version bumped to ${task.version.Major}.${task.version.Minor}.${task.version.Patch}`);
