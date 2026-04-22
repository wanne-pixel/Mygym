const fs = require('fs');
const path = require('path');

const exercisesPath = path.join(__dirname, 'src/data/exercises.json');
const exercises = JSON.parse(fs.readFileSync(exercisesPath, 'utf8'));

const updatedExercises = exercises.map(ex => {
  let subTarget_ko = '';
  let subTarget_en = '';

  const name = ex.name || '';
  const nameEn = ex.name_en || '';
  const bodyPart = (ex.bodyPart || '').trim();
  const target = ex.target || '';

  if (bodyPart === '가슴') {
    if (name.includes('인클라인') || nameEn.toLowerCase().includes('incline') || target.includes('상부')) {
      subTarget_ko = '상부';
      subTarget_en = 'Upper';
    } else if (name.includes('디클라인') || nameEn.toLowerCase().includes('decline') || target.includes('하부') || name.includes('딥스') || nameEn.toLowerCase().includes('dip')) {
      subTarget_ko = '하부';
      subTarget_en = 'Lower';
    } else {
      subTarget_ko = '중부';
      subTarget_en = 'Mid';
    }
  } else if (bodyPart === '등') {
    if (name.includes('슈러그') || nameEn.toLowerCase().includes('shrug') || target.includes('승모근')) {
      subTarget_ko = '승모근';
      subTarget_en = 'Traps';
    } else if (name.includes('익스텐션') || nameEn.toLowerCase().includes('extension') || name.includes('기립근') || nameEn.toLowerCase().includes('erector') || name.includes('굿모닝') || nameEn.toLowerCase().includes('good morning')) {
      subTarget_ko = '하부/기립근';
      subTarget_en = 'Erector Spinae';
    } else if (name.includes('로우') || nameEn.toLowerCase().includes('row') || name.includes('풀오버') || nameEn.toLowerCase().includes('pullover') || name.includes('T바') || nameEn.toLowerCase().includes('t-bar')) {
      subTarget_ko = '두께';
      subTarget_en = 'Thickness';
    } else if (name.includes('풀다운') || nameEn.toLowerCase().includes('pulldown') || name.includes('풀업') || nameEn.toLowerCase().includes('pull up') || name.includes('친업') || nameEn.toLowerCase().includes('chin up') || name.includes('렛풀') || nameEn.toLowerCase().includes('lat pull')) {
      subTarget_ko = '넓이';
      subTarget_en = 'Width';
    } else if (name.includes('데드리프트') || nameEn.toLowerCase().includes('deadlift')) {
      subTarget_ko = '두께';
      subTarget_en = 'Thickness';
    } else {
      subTarget_ko = '두께';
      subTarget_en = 'Thickness';
    }
  } else if (bodyPart === '어깨') {
    if (name.includes('프론트') || nameEn.toLowerCase().includes('front') || name.includes('밀리터리') || nameEn.toLowerCase().includes('military') || name.includes('오버헤드') || nameEn.toLowerCase().includes('overhead') || name.includes('아놀드') || nameEn.toLowerCase().includes('arnold') || (name.includes('프레스') && !name.includes('비하인드'))) {
      subTarget_ko = '전면';
      subTarget_en = 'Front';
    } else if (name.includes('리어') || nameEn.toLowerCase().includes('rear') || name.includes('후면') || nameEn.toLowerCase().includes('reverse fly') || name.includes('페이스풀') || nameEn.toLowerCase().includes('face pull')) {
      subTarget_ko = '후면';
      subTarget_en = 'Rear';
    } else {
      subTarget_ko = '측면';
      subTarget_en = 'Side';
    }
  } else if (bodyPart === '하체') {
    if (name.includes('카프') || nameEn.toLowerCase().includes('calf')) {
      subTarget_ko = '종아리';
      subTarget_en = 'Calves';
    } else if (name.includes('컬') || nameEn.toLowerCase().includes('curl') || name.includes('데드리프트') || nameEn.toLowerCase().includes('deadlift') || name.includes('힙') || nameEn.toLowerCase().includes('hip') || name.includes('둔근') || nameEn.toLowerCase().includes('glute') || name.includes('햄스트링') || nameEn.toLowerCase().includes('hamstring') || name.includes('브리지') || nameEn.toLowerCase().includes('bridge') || name.includes('어브덕션') || nameEn.toLowerCase().includes('abduction') || name.includes('어덕션') || nameEn.toLowerCase().includes('adduction')) {
      subTarget_ko = '햄스트링/둔근';
      subTarget_en = 'Hamstrings/Glutes';
    } else {
      subTarget_ko = '대퇴사두근';
      subTarget_en = 'Quads';
    }
  } else if (bodyPart === '팔') {
    if (name.includes('삼두') || nameEn.toLowerCase().includes('tricep') || name.includes('푸시다운') || nameEn.toLowerCase().includes('pushdown') || name.includes('킥백') || nameEn.toLowerCase().includes('kickback') || (name.includes('익스텐션') && !name.includes('컬')) || name.includes('딥스') || nameEn.toLowerCase().includes('dip') || name.includes('클로즈 그립 벤치')) {
      subTarget_ko = '삼두근';
      subTarget_en = 'Triceps';
    } else if (name.includes('리스트') || nameEn.toLowerCase().includes('wrist') || name.includes('전완') || nameEn.toLowerCase().includes('forearm')) {
      subTarget_ko = '전완근';
      subTarget_en = 'Forearms';
    } else {
      subTarget_ko = '이두근';
      subTarget_en = 'Biceps';
    }
  } else if (bodyPart === '코어' || bodyPart === '허리/코어') {
    if (name.includes('트위스트') || nameEn.toLowerCase().includes('twist') || name.includes('사이드') || nameEn.toLowerCase().includes('side') || name.includes('복사근') || nameEn.toLowerCase().includes('oblique') || name.includes('회전') || nameEn.toLowerCase().includes('rotation') || name.includes('힐터치') || nameEn.toLowerCase().includes('heel touch')) {
      subTarget_ko = '복사근/회전';
      subTarget_en = 'Obliques';
    } else {
      subTarget_ko = '복직근';
      subTarget_en = 'Rectus Abdominis';
    }
  } else {
    subTarget_ko = '기타';
    subTarget_en = 'Other';
  }

  return {
    ...ex,
    subTarget_ko,
    subTarget_en
  };
});

fs.writeFileSync(exercisesPath, JSON.stringify(updatedExercises, null, 2));
console.log(`Updated ${updatedExercises.length} exercises.`);
