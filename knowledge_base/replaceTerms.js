const fs = require('fs');
const path = require('path');

const TERMS_MAP_FILE = 'terms_map.json';
const EXTENSIONS = ['md', 'txt']; // добавить другие, если нужно

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

function replaceTermsInText(text, termsMap) {
    let newText = text;
    for (const [key, value] of Object.entries(termsMap)) {
        // Все вхождения, чувствительно к регистру
        newText = newText.split(key).join(value);
        // Для регистронезависимой замены используйте:
        // newText = newText.replace(new RegExp(key, 'gi'), value);
    }
    return newText;
}

function main() {
    const termsMap = loadTermsMap();
    const files = findFiles('.', EXTENSIONS);

    files.forEach((file) => {
        const original = fs.readFileSync(file, 'utf8');
        const replaced = replaceTermsInText(original, termsMap);
        if (original !== replaced) {
            fs.writeFileSync(file, replaced, 'utf8');
            console.log(`Updated: ${file}`);
        }
    });
}

main();
