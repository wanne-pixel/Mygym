const fs = require('fs');

const filePath = '/home/user/mygym/src/data/exercises.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const translations = [
  // Multi-word first
  { pattern: /CLOSE GRIP/gi, replacement: '클로즈 그립' },
  { pattern: /WIDE GRIP/gi, replacement: '와이드 그립' },
  { pattern: /NEUTRAL GRIP/gi, replacement: '뉴트럴 그립' },
  { pattern: /LEG RAISE/gi, replacement: '레그 레이즈' },
  { pattern: /STEP-UP/gi, replacement: '스텝업' },
  { pattern: /SIT-UP/gi, replacement: '싯업' },
  { pattern: /REAR DELT(OID)?/gi, replacement: '후면 삼각근' },
  
  // Single words
  { pattern: /REAR/gi, replacement: '후면' },
  { pattern: /DELT(OID)?/gi, replacement: '삼각근' },
  { pattern: /PULL/gi, replacement: '풀' },
  { pattern: /KNEELING/gi, replacement: '닐링' },
  { pattern: /ASSISTED/gi, replacement: '어시스트' },
  { pattern: /ALTERNATING/gi, replacement: '얼터네이트' },
  { pattern: /ALTERNATE/gi, replacement: '얼터네이트' },
  { pattern: /GRIP/gi, replacement: '그립' },
  { pattern: /HAMMER/gi, replacement: '해머' },
  { pattern: /BENCH/gi, replacement: '벤치' },
  { pattern: /PRESS/gi, replacement: '프레스' },
  { pattern: /FLY/gi, replacement: '플라이' },
  { pattern: /ROW/gi, replacement: '로우' },
  { pattern: /CURL/gi, replacement: '컬' },
  { pattern: /EXTENSION/gi, replacement: '익스텐션' },
  { pattern: /PUSHDOWN/gi, replacement: '푸쉬다운' },
  { pattern: /KICKBACK/gi, replacement: '킥백' },
  { pattern: /OVERHEAD/gi, replacement: '오버헤드' },
  { pattern: /LATERAL/gi, replacement: '레터럴' },
  { pattern: /FRONT/gi, replacement: '프론트' },
  { pattern: /SIDE/gi, replacement: '사이드' },
  { pattern: /SHRUG/gi, replacement: '슈러그' },
  { pattern: /PULLOVER/gi, replacement: '풀오버' },
  { pattern: /CONCENTRATION/gi, replacement: '컨센트레이션' },
  { pattern: /PREACHER/gi, replacement: '프리처' },
  { pattern: /SMITH/gi, replacement: '스미스' },
  { pattern: /LEVER/gi, replacement: '레버' },
  { pattern: /MACHINE/gi, replacement: '머신' },
  { pattern: /SQUAT/gi, replacement: '스쿼트' },
  { pattern: /LUNGE/gi, replacement: '런지' },
  { pattern: /DEADLIFT/gi, replacement: '데드리프트' },
  { pattern: /CALF/gi, replacement: '카프' },
  { pattern: /HIP/gi, replacement: '힙' },
  { pattern: /BRIDGE/gi, replacement: '브릿지' },
  { pattern: /PLANK/gi, replacement: '플랭크' },
  { pattern: /CRUNCH/gi, replacement: '크런치' },
  { pattern: /TWIST/gi, replacement: '트위스트' },
  { pattern: /CABLE/gi, replacement: '케이블' },
  { pattern: /BARBELL/gi, replacement: '바벨' },
  { pattern: /DUMBBELL/gi, replacement: '덤벨' },
  { pattern: /NARROW/gi, replacement: '내로우' }, // Fix common issue
  { pattern: /NAR로우/gi, replacement: '내로우' }, // Fix specifically what I saw
  { pattern: /UP/gi, replacement: '업' }, // To be consistent with 풀 업, 싯업
  
  { pattern: /\bMAN\b/g, replacement: '남성' },
  { pattern: /\bWOMAN\b/g, replacement: '여성' },
  
  // Deletions
  { pattern: /\(male\)/gi, replacement: '' },
  { pattern: /\bMALE\b/gi, replacement: '' },
  { pattern: /\(female\)/gi, replacement: '' },
  { pattern: /\bFEMALE\b/gi, replacement: '' },
  { pattern: /\bv\.\s?\d+\b/gi, replacement: '' }
];

data.forEach(item => {
  let name = item.name;
  translations.forEach(trans => {
    name = name.replace(trans.pattern, trans.replacement);
  });
  // Clean up extra spaces
  item.name = name.replace(/\s+/g, ' ').trim();
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('Successfully updated exercises.json');
