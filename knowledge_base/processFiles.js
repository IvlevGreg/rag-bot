const fs = require('fs');
const path = require('path');

const INPUT_DIR = 'original_files';
const OUTPUT_DIR = 'processed_files';
const INPUT_EXT = ['html', 'htm', 'md', 'txt'];

function findFiles(dir, exts) {
    const files = [];
    function walk(subdir) {
        for (const f of fs.readdirSync(subdir)) {
            const filepath = path.join(subdir, f);
            if (fs.statSync(filepath).isDirectory()) walk(filepath);
            else if (exts.includes(filepath.split('.').pop().toLowerCase())) files.push(filepath);
        }
    }
    walk(dir);
    return files;
}

function cleanText(text) {
    text = text.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<\/?[^>]+(>|$)/g, ' ');
    text = text.replace(/&[a-z#0-9]+;/gi, ' ');
    text = text.replace(/!\[.*?\]\(.*?\)/g, ' ');
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    text = text.replace(/[*_]{1,2}([^*_]+)[*_]{1,2}/g, '$1');
    text = text.replace(/^#+\s*(.*)/gm, '$1');
    text = text.replace(/`{1,3}([^`]*)`{1,3}/g, '$1');
    text = text.replace(/```[\s\S]*?```/g, ' ');
    text = text.replace(/^>\s?/gm, '');
    text = text.replace(/^\s*([-*+]\s+)/gm, '');
    text = text.replace(/^\s*\d+\.\s+/gm, '');
    text = text.replace(/[ \t]+/g, ' ');
    text = text.replace(/\n{2,}/g, '\n');
    text = text.replace(/^\s+|\s+$/g, '');
    return text;
}

function ensureDirSync(dir) {
    if (!fs.existsSync(dir)) {
        ensureDirSync(path.dirname(dir)); // рекурсивно наверх
        fs.mkdirSync(dir);
    }
}

function main() {
    if (!fs.existsSync(INPUT_DIR)) {
        console.error(`Input dir "${INPUT_DIR}" not found`);
        process.exit(1);
    }
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

    const files = findFiles(INPUT_DIR, INPUT_EXT);
    files.forEach((file) => {
        const raw = fs.readFileSync(file, 'utf8');
        const cleaned = cleanText(raw);
        if (cleaned.length > 10) {
            const relPath = path.relative(INPUT_DIR, file);
            const outPath = path.join(
                OUTPUT_DIR,
                relPath.replace(/\.[^.]+$/, '.txt')
            );
            // Создать директории, если нет
            ensureDirSync(path.dirname(outPath));
            fs.writeFileSync(outPath, cleaned, 'utf8');
            console.log(`Saved: ${outPath}`);
        }
    });
}

main();
