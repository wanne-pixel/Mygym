
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/data/exercises.json');
const exercises = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const replacements = [
  // Versions and Genders
  [/v\.\s*\d+/gi, ''],
  [/V\.\s*\d+/gi, ''],
  [/\(male\)/gi, ''],
  [/\(female\)/gi, ''],

  // Multi-word / Specific terms first
  [/SINGLE\s*ARMS?/gi, '원 암'],
  [/ONE\s*ARMS?/gi, '원 암'],
  [/PUSH\s*UPS?/gi, '푸쉬업'],
  [/CROSS\s*OVERS?/gi, '크로스오버'],
  [/PULL\s*OVERS?/gi, '풀오버'],
  [/PULL\s*UPS?/gi, '풀업'],
  [/CHIN\s*UPS?/gi, '친업'],
  [/LEG\s*PRESS/gi, '레그 프레스'],
  [/BENCH\s*PRESS/gi, '벤치 프레스'],
  [/SHOULDER\s*PRESS/gi, '숄더 프레스'],
  [/MILITARY\s*PRESS/gi, '밀리터리 프레스'],
  [/BICEPS?\s*CURL/gi, '이두 컬'],
  [/TRICEPS?\s*EXTENSION/gi, '삼두 익스텐션'],
  [/LAT\s*PULL\s*DOWN/gi, '렛 풀 다운'],
  [/STABILITY\s*BALL/gi, '스테빌리티 볼'],
  [/EXERCISE\s*BALL/gi, '엑서사이즈 볼'],

  // Body Parts
  [/PERONEALS?/gi, '비골근'],
  [/SCAPULAE?|SCAPULA/gi, '견갑골'],
  [/GLUTES?/gi, '둔근'],
  [/HAMSTRINGS?/gi, '햄스트링'],
  [/TRICEPS?/gi, '삼두'],
  [/BICEPS?/gi, '이두'],
  [/DELTOIDS?|DELT/gi, '삼각근'],
  [/QUADS?/gi, '대퇴사두'],
  [/TRAPS?/gi, '승모근'],
  [/LATS?/gi, '광배근'],
  [/CORE/gi, '코어'],
  [/Pectorals?/gi, '가슴'],
  [/CALF|CALVES/gi, '카프'],
  [/ABDOMINAL/gi, '복근'],
  [/ABS/gi, '복근'],
  [/OBlique/gi, '외복사근'],

  // Main movement/equipment terms
  [/KNEELING/gi, '닐링'],
  [/INNER/gi, '이너'],
  [/PRESSES?/gi, '프레스'],
  [/FLYES?|FLY/gi, '플라이'],
  [/ROWS?/gi, '로우'],
  [/CURLS?/gi, '컬'],
  [/EXTENSIONS?/gi, '익스텐션'],
  [/SQUATS?/gi, '스쿼트'],
  [/LUNGES?/gi, '런지'],
  [/DEADLIFTS?/gi, '데드리프트'],
  [/DIPS?/gi, '딥스'],
  [/RAISES?/gi, '레이즈'],
  [/SHROUGS?/gi, '슈러그'],
  [/SHRUGS?/gi, '슈러그'],
  [/UPPER/gi, '상부'],
  [/LOWER/gi, '하부'],
  [/OVERS?/gi, '오버'],
  [/UNDERS?/gi, '언더'],
  [/REVERSE/gi, '리버스'],
  [/WIDE/gi, '와이드'],
  [/NARROW/gi, '내로우'],
  [/INCLINE/gi, '인클라인'],
  [/DECLINE/gi, '디클라인'],
  [/BENCH/gi, '벤치'],
  [/CABLE/gi, '케이블'],
  [/BARBELLS?/gi, '바벨'],
  [/DUMBELLS?|DUMBBELLS?/gi, '덤벨'],
  [/MACHINES?/gi, '머신'],
  [/SEATED/gi, '시티드'],
  [/STANDING/gi, '스탠딩'],
  [/LYING/gi, '라이잉'],
  [/BODYWEIGHT/gi, '맨몸'],

  // Korean specific corrections (including fixing previous run errors)
  [/원 팔/g, '원 암'],
  [/삼두근/g, '삼두'],
  [/이두근/g, '이두'],
  [/종아리/g, '카프'],
  [/S업PORT/gi, '서포트'],
  [/업PER/gi, '상부'],
  [/삼두S/gi, '삼두'],
  [/이두S/gi, '이두'],
  [/레이즈S/gi, '레이즈'],
  [/프레스S/gi, '프레스'],
  [/플라이S/gi, '플라이'],
  [/로우S/gi, '로우'],
  [/컬S/gi, '컬'],
  [/익스텐션S/gi, '익스텐션'],
  [/스쿼트S/gi, '스쿼트'],
  [/런지S/gi, '런지'],
  [/데드리프트S/gi, '데드리프트'],
  [/푸쉬업S/gi, '푸쉬업'],
  [/딥스S/gi, '딥스'],
  [/슈러그S/gi, '슈러그'],
  [/오버S/gi, '오버'],
  [/언더S/gi, '언더'],

  // More terms
  [/SUPPORT/gi, '서포트'],
  [/ATTACHMENT/gi, '어태치먼트'],
  [/CROSS/gi, '크로스'],
  [/UP/gi, '업'],
  [/DOWN/gi, '다운'],
  [/PULL/gi, '풀'],
  [/CHIN/gi, '친'],
  [/GRIP/gi, '그립'],
  [/BAR/gi, '바'],
  [/BALL/gi, '볼'],
  [/HIGH/gi, '하이'],
  [/LOW/gi, '로우'],
  [/FLOOR/gi, '플로어'],
  [/DEPTH/gi, '뎁스'],
  [/JUMP/gi, '점프'],
  [/DROP/gi, '드롭'],
  [/CLAP/gi, '클랩'],
  [/CLOCK/gi, '클락'],
  [/ARCHER/gi, '아처'],
  [/ISOMETRIC/gi, '아이소메트릭'],
  [/SQUEEZE/gi, '스퀴즈'],
  [/WIPERS/gi, '와이퍼'],
  [/PLYO/gi, '플라이오'],
  [/GUILLOTINE/gi, '기요틴'],
  [/PREACHER/gi, '프리처'],
  [/SNATCH/gi, '스내치'],
  [/HAMMER/gi, '해머'],
  [/ALTERNATE/gi, '얼터네이트'],
  [/TWIST/gi, '트위스트'],
  [/FRONT/gi, '프론트'],
  [/SIDE/gi, '사이드'],
  [/LATERAL/gi, '레터럴'],
  [/BACK/gi, '백'],
  [/FULL/gi, '풀'],
  [/RANGE/gi, '레인지'],
  [/MOTION/gi, '모션'],
  [/STERNUM/gi, '스터넘'],
  [/GIRONDA/gi, '지론다'],
  [/CLEAN/gi, '클린'],
  [/JERK/gi, '저크'],
  [/SWING/gi, '스윙'],
  [/BURPEE/gi, '버피'],
  [/PLANK/gi, '플랭크'],
  [/CRUNCH/gi, '크런치'],
  [/LEG/gi, '레그'],
  [/KICK/gi, '킥'],
  [/WRIST/gi, '리스트'],
  [/STRETCHING/gi, '스트레칭'],
  [/HEAD/gi, '헤드'],
  [/MILITARY/gi, '밀리터리'],
  [/BEHIND/gi, '비하인드'],
  [/NECK/gi, '넥'],
  [/HIP/gi, '힙'],
  [/STABILITY/gi, '스테빌리티'],
  [/EXERCISE/gi, '엑서사이즈']
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
console.log('Successfully updated exercise names with final refined rules.');
