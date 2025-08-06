const fs = require('fs');

// Считать исходный файл с комментариями
const inputFile = 'terms_map_draft_with_comments.js';
const outputFile = 'terms_map_draft_without_comments.json';

const lines = fs.readFileSync(inputFile, 'utf8').split('\n');

// Удаляем строки-комментарии и вычищаем trailing запятые у последнего члена (если есть)
const cleanedLines = lines
    .map(line => {
        if (line.includes('//')) {
            // Убираем комментарий только после основной пары
            return line.replace(/\/\/.*$/, '').trimEnd();
        }
        return line;
    })
    .filter(line => line.trim().length > 0);

// Собираем обратно, минимально чистим
let content = cleanedLines.join('\n');

// Можно дополнительно отформатировать для строгого JSON
// Например: заменить все одинарные кавычки на двойные (лучше заранее делать двойные)

// Проверка: если вдруг оставили запятую у последней строки перед }
content = content.replace(/,(\s*})/g, '$1');

fs.writeFileSync(outputFile, content, 'utf8');

console.log(`terms_map.json создан без комментариев на основе ${inputFile}`);
