const fs = require('fs');

const pkg = JSON.parse(fs.readFileSync('../GPTPullRequestReview/package.json', 'utf8'));
const ext = JSON.parse(fs.readFileSync('../vss-extension.json', 'utf8'));

ext.version = pkg.version; 

fs.writeFileSync('vss-extension.json', JSON.stringify(ext, null, 2));

console.log(`vss-extension.json version updated to ${pkg.version}`);
