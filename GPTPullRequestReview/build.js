const fs = require('fs');
const path = require('path');
const child_process = require('child_process');
const fse = require('fs-extra');

// Accept environment argument (either 'Dev' or 'Prod')
const environment = process.argv[2] || 'Dev';

const sourceDir = __dirname;
const targetDir = path.join(__dirname, '..', `GPTPullRequestReview-${environment}`);

if (environment !== 'Dev' && environment !== 'Prod') {
    console.error("Invalid environment. Use 'Dev' or 'Prod'.");
    process.exit(1);
}

// Clear the target folder, except for task.json
function clearTargetFolderExceptTask() {
    fs.readdirSync(targetDir).forEach(file => {
        const filePath = path.join(targetDir, file);
        if (file !== 'task.json') {
            if (fs.lstatSync(filePath).isDirectory()) {
                fse.removeSync(filePath);
            } else {
                fs.unlinkSync(filePath);
            }
        }
    });
}

function runBuild() {
    console.log('Running npm build...');
    child_process.execSync('npm run build', { stdio: 'inherit', cwd: sourceDir });
}

function copyFilesToTarget() {
    console.log(`Copying files to GPTPullRequestReview-${environment}...`);

    fse.copySync(sourceDir, targetDir);

    console.log('Files copied successfully!');
}

function installDependencies() {
    console.log(`Installing dependencies in GPTPullRequestReview-${environment}...`);
    child_process.execSync('npm install', { stdio: 'inherit', cwd: targetDir });
}

function buildExtension() {
    try {
        // Step 1: Clear the target folder except for task.json
        clearTargetFolderExceptTask();

        // Step 2: Run npm build
        runBuild();

        // Step 3: Copy files to the target folder (Dev or Prod)
        copyFilesToTarget();

        // Step 4: Install dependencies in the target folder
        installDependencies();

        console.log(`Build and copy complete for ${environment} extension!`);
    } catch (error) {
        console.error('Error during build process:', error);
    }
}

buildExtension();
