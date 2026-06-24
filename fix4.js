import fs from 'fs';
const file = 'src/components/WorkoutPlan/AiWizard.jsx';
let content = fs.readFileSync(file, 'utf8');

// Replace \` and \$ with ` and $
content = content.replace(/\\`/g, '`').replace(/\\\$/g, '$');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed escaped backticks in AiWizard.jsx');
