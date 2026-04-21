
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/data/exercises.json');
const exercises = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const replacements = [
  // Rule 1 & 2: Terms
  [/KNEELING/gi, '닐링'],
  [/INNER/gi, '이너'],
  [/PULLOVER/gi, '풀오버'],
  [/PRESS/gi, '프레스'],
  [/FLY/gi, '플라이'],
  [/ROW/gi, '로우'],
  [/CURL/gi, '컬'],
  [/EXTENSION/gi, '익스텐션'],
  [/SQUAT/gi, '스쿼트'],
  [/LUNGE/gi, '런지'],
  [/DEADLIFT/gi, '데드리프트'],
  [/PUSH UP/gi, '푸쉬업'],
  [/DIP/gi, '딥스'],
  [/RAISES/gi, '레이즈'],
  [/SHROUG/gi, '슈러그'],
  [/SHRUG/gi, '슈러그'],
  [/OVER/gi, '오버'],
  [/UNDER/gi, '언더'],
  [/REVERSE/gi, '리버스'],
  [/WIDE/gi, '와이드'],
  [/NARROW/gi, '내로우'],
  [/INCLINE/gi, '인클라인'],
  [/DECLINE/gi, '디클라인'],
  [/BENCH/gi, '벤치'],
  [/CABLE/gi, '케이블'],
  [/BARBELL/gi, '바벨'],
  [/DUMBELL/gi, '덤벨'],
  [/DUMBBELL/gi, '덤벨'],
  [/MACHINE/gi, '머신'],
  [/SEATED/gi, '시티드'],
  [/STANDING/gi, '스탠딩'],
  [/LYING/gi, '라이잉'],
  [/SINGLE ARM/gi, '원 암'],
  [/ONE ARM/gi, '원 암'],
  [/BODYWEIGHT/gi, '맨몸'],
  [/PERONEALS/gi, '비골근'],
  [/SCAPULA/gi, '견갑골'],
  [/GLUTE/gi, '둔근'],
  [/HAMSTRING/gi, '햄스트링'],
  [/TRICEP/gi, '삼두'],
  [/BICEP/gi, '이두'],
  [/DELTOID/gi, '삼각근'],
  [/QUAD/gi, '대퇴사두'],
  [/TRAP/gi, '승모근'],
  [/LAT/gi, '광배근'],
  [/CORE/gi, '코어'],
  [/Pectoral/gi, '가슴'],
  [/CALF/gi, '카프'],
  
  // Rule 3 & Versions/Gender
  [/v\.\s*\d+/gi, ''],
  [/\(male\)/gi, ''],
  [/\(female\)/gi, ''],
  [/원 팔/g, '원 암'],
  [/삼두근/g, '삼두'],
  [/이두근/g, '이두'],
  [/종아리/g, '카프']
];

exercises.forEach(ex => {
  let name = ex.name;
  replacements.forEach(([regex, replacement]) => {
    name = name.replace(regex, replacement);
  });
  
  // Clean up extra spaces
  name = name.replace(/\s+/g, ' ').trim();
  
  ex.name = name;
});

fs.writeFileSync(filePath, JSON.stringify(exercises, null, 2), 'utf8');
console.log('Successfully updated exercise names.');
