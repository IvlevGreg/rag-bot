const fs = require('fs');
const path = require('path');
const { faker } = require('@faker-js/faker');

const EXTENSIONS = ['md', 'txt'];
const TOP = 50;
const TERM_REGEX = /\b([A-Z][a-z0-9]+(?:[-\s][A-Z][a-z0-9]+){0,3})\b/g;

function findFiles(dir, exts) {
    const files = [];
    function walk(subdir) {
        for (const f of fs.readdirSync(subdir)) {
            const filepath = path.join(subdir, f);
            if (fs.statSync(filepath).isDirectory()) walk(filepath);
            else if (exts.includes(filepath.split('.').pop())) files.push(filepath);
        }
    }
    walk(dir);
    return files;
}

function isTermValid(term) {
    const STOPWORDS = new Set([
        'The', 'And', 'But', 'For', 'You', 'All', 'Not', 'One', 'Two', 'Three', 'Four',
        'Five', 'Are', 'Was', 'She', 'Him', 'Her', 'His', 'Had', 'Can', 'May', 'Sir', 'This', 'Episode', 'They',
        "January", "February", "March", "April", "May", "June", "July", "August", "September","October", "November", "December",
        "Them", "Their", "Those", "Nevertheless", "Nonetheless",
        "Yet", "Though", "Although", "Even so",'However',
    ]);
    const clean = term.trim();
    if (clean.length < 4) return false;
    if (STOPWORDS.has(clean)) return false;
    if (/^[A-Z][a-z]{1,2}$/.test(clean)) return false;
    return true;
}

function main() {
    const files = findFiles('processed_files', EXTENSIONS);
    const freq = {};

    for (const file of files) {
        const text = fs.readFileSync(file, 'utf-8');
        let m;
        while ((m = TERM_REGEX.exec(text)) !== null) {
            const term = m[1];
            if (!isTermValid(term)) continue;
            freq[term] = (freq[term] || 0) + 1;
        }
    }

    const sorted = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, TOP);

    const termsArray = sorted.map(([term, count]) => ({ term, count }));

    // Для генерации уникальных случайных имён
    const generatedNames = new Set();
    function uniqueRandomName() {
        let name;
        do {
            name = faker.word.adjective().charAt(0).toUpperCase() + faker.word.adjective().slice(1) +
                ' ' + faker.science.chemicalElement().name;
        } while (generatedNames.has(name));
        generatedNames.add(name);
        return name;
    }

    // Подготовка json с комментариями
    const commentLines = [];
    termsArray.forEach((item) => {
        const fakeName = uniqueRandomName();
        // Найти более длинные термины из топа, которые содержат этот
        const containing = termsArray
            .filter(x => x.term !== item.term && x.term.length > item.term.length && x.term.toLowerCase().includes(item.term.toLowerCase()));
        let comment = `(${item.count})`;
        if (containing.length) {
            comment += containing.map(x => ` => Входит в: "${x.term}" (${x.count})`).join('');
        }
        commentLines.push(`  "${item.term}": "${fakeName}", // ${comment}`);
    });

    const jsonWithComments =
        '{\n' +
        commentLines.join('\n') +
        '\n}';
    fs.writeFileSync('terms_map_draft_with_comments.js', jsonWithComments, 'utf8');

    console.log('Draft terms map with JS-style comments saved to terms_map_draft_with_comments.js');
    console.log('Пример:');
    console.log(commentLines.slice(0, 5).join('\n'));
}

main();
