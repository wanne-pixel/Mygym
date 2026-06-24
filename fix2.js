import fs from 'fs';
const file = 'src/api/aiRoutineApi.js';
let content = fs.readFileSync(file, 'utf8');

// The Master agent probably used unescaped backticks inside a template literal.
content = content.replace(/ \`dayId\`/g, ' \\`dayId\\`');
content = content.replace(/ \`target\`/g, ' \\`target\\`');
content = content.replace(/\`exercises\`/g, '\\`exercises\\`');
content = content.replace(/\`targetSets\`/g, '\\`targetSets\\`');

fs.writeFileSync(file, content, 'utf8');
console.log('Escaped backticks in aiRoutineApi.js');
