import fs from 'fs';

const files = [
  'src/components/WorkoutPlan/AiWizard.jsx',
  'src/api/aiRoutineApi.js',
  'src/components/Calendar/CalendarScreen.jsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.split('\\`').join('`');
    content = content.split('\\$').join('$');
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Fixed syntax in ${file}`);
  }
}
