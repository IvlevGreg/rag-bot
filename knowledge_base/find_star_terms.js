const fs = require('fs');
const path = require('path');

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

    const termsSet = new Set(sorted.map(([term]) => term));
    const termsArray = sorted.map(([term, count]) => ({term, count}));

    // Найти частичные (вложенные) пересечения
    function findContainingTerms(target, skipTerm) {
        const lowerTarget = target.toLowerCase();
        return termsArray
            .filter(x =>
                x.term !== target &&
                (
                    x.term.toLowerCase().includes(lowerTarget) ||
                    lowerTarget.includes(x.term.toLowerCase())
                )
            );
    }

    console.log('\n50 самых популярных "фантастических" терминов:\n');
    termsArray.forEach(({term, count}, i) => {
        console.log(`${i + 1}. "${term}" — ${count}`);
        // Находим кто содержит этот термин, но длиннее его
        const longer = termsArray
            .filter(x =>
                x.term !== term &&
                x.term.length > term.length &&
                x.term.toLowerCase().includes(term.toLowerCase())
            );
        longer.forEach(x => {
            console.log(`    Входит в: "${x.term}" — ${x.count}`);
        });
        // Можно раскомментировать, чтобы искать и когда текущий входит в короткие (например, "Obi-Wan Kenobi" ← "Obi-Wan")
        /*
        const shorter = termsArray
            .filter(x =>
                x.term !== term &&
                x.term.length < term.length &&
                term.toLowerCase().includes(x.term.toLowerCase())
            );
        shorter.forEach(x => {
            console.log(`    Содержит: "${x.term}" — ${x.count}`);
        });
        */
    });
}

main();
