const fs = require('fs');
const path = require('path');

const TERMS_MAP_FILE = 'terms_map.json';
const EXTENSIONS = ['md', 'txt']; // добавить другие расширения если нужно

function loadTermsMap() {
    const raw = fs.readFileSync(TERMS_MAP_FILE, 'utf8');
    return JSON.parse(raw);
}

function findFiles(startDir, extensions) {
    const files = [];
    function walk(dir) {
        const dirList = fs.readdirSync(dir);
        dirList.forEach((file) => {
            const filepath = path.join(dir, file);
            const stat = fs.statSync(filepath);
            if (stat.isDirectory()) {
                walk(filepath);
            } else {
                if (extensions.includes(filepath.split('.').pop())) {
                    files.push(filepath);
                }
            }
        });
    }
    walk(startDir);
    return files;
}

function replaceTermsWithCount(text, termsMap) {
    let newText = text;
    const changesPerKey = {};
    for (const [key, value] of Object.entries(termsMap)) {
        const regex = new RegExp(key.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g'); // escape key
        const matches = newText.match(regex);
        const count = matches ? matches.length : 0;
        if (count > 0) {
            newText = newText.replace(regex, value);
            changesPerKey[key] = count;
        }
    }
    return { newText, changesPerKey };
}

function main() {
    const termsMap = loadTermsMap();
    const files = findFiles('.', EXTENSIONS);
    let totalFilesChanged = 0;
    let totalReplacements = 0;

    files.forEach((file) => {
        const original = fs.readFileSync(file, 'utf8');
        const { newText, changesPerKey } = replaceTermsWithCount(original, termsMap);

        if (Object.keys(changesPerKey).length > 0) {
            fs.writeFileSync(file, newText, 'utf8');
            totalFilesChanged++;
            let perFileCount = 0;
            console.log(`\nUpdated: ${file}`);
            Object.entries(changesPerKey).forEach(([key, count]) => {
                perFileCount += count;
                console.log(`  "${key}" replaced ${count} times`);
            });
            totalReplacements += perFileCount;
            console.log(`  Total replacements in file: ${perFileCount}`);
        }
    });

    console.log('\nSUMMARY:');
    console.log(`  Files updated: ${totalFilesChanged}`);
    console.log(`  Total replacements: ${totalReplacements}`);
}

main();
