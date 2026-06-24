import fs from 'fs';
const file = 'src/api/aiRoutineApi.js';
let content = fs.readFileSync(file, 'utf8');

// Fix the markdown json backticks
content = content.replace(/```json/g, '\\`\\`\\`json');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed json backticks in aiRoutineApi.js');
