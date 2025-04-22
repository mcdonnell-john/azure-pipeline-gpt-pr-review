const fs = require('fs');

// Function to update version in a JSON file
function updateVersionInFile(filePath, version) {
    const fileData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    fileData.version = version;
    fs.writeFileSync(filePath, JSON.stringify(fileData, null, 2));
    console.log(`✅ ${filePath} version set to ${version}`);
}

// Function to update task version
function bumpTaskPatchVersion(taskPath) {
    const task = JSON.parse(fs.readFileSync(taskPath, 'utf8'));
    const { Major, Minor, Patch } = task.version;
    task.version = {
        Major,
        Minor,
        Patch: String(Number(Patch) + 1)
    };
    fs.writeFileSync(taskPath, JSON.stringify(task, null, 2));
    console.log(`✅ task.json patch version bumped to ${task.version.Major}.${task.version.Minor}.${task.version.Patch}`);
}

// Load package.json
const pkg = JSON.parse(fs.readFileSync('./GPTPullRequestReview/package.json', 'utf8'));

// Update vss-extension.json
updateVersionInFile('./vss-extension.json', pkg.version);

// Bump patch version in task.json
bumpTaskPatchVersion('./GPTPullRequestReview-Prod/task.json');