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

  const fullName = (name + ' ' + nameEn).toLowerCase();

  if (bodyPart === '가슴') {
    if (fullName.includes('인클라인') || fullName.includes('incline') || target.includes('상부')) {
      subTarget_ko = '상부';
      subTarget_en = 'Upper';
    } else if (fullName.includes('디클라인') || fullName.includes('decline') || target.includes('하부') || fullName.includes('딥스') || fullName.includes('dip')) {
      subTarget_ko = '하부';
      subTarget_en = 'Lower';
    } else {
      subTarget_ko = '중부';
      subTarget_en = 'Mid';
    }
  } else if (bodyPart === '등') {
    if (fullName.includes('암 풀다운') || fullName.includes('arm pulldown')) {
      subTarget_ko = '광배근';
      subTarget_en = 'Lats';
    } else if (fullName.includes('슈러그') || fullName.includes('shrug') || target.includes('승모근')) {
      subTarget_ko = '승모근';
      subTarget_en = 'Traps';
    } else if (fullName.includes('익스텐션') || fullName.includes('extension') || fullName.includes('기립근') || fullName.includes('erector') || fullName.includes('굿모닝') || fullName.includes('good morning')) {
      subTarget_ko = '하부/기립근';
      subTarget_en = 'Erector Spinae';
    } else if (fullName.includes('풀다운') || fullName.includes('pulldown') || fullName.includes('풀업') || fullName.includes('pull up') || fullName.includes('pull-up') || fullName.includes('친업') || fullName.includes('친 업') || fullName.includes('chin up') || fullName.includes('chin-up') || fullName.includes('렛풀') || fullName.includes('lat pull')) {
      subTarget_ko = '넓이';
      subTarget_en = 'Width';
    } else if (fullName.includes('로우') || fullName.includes('row') || fullName.includes('풀오버') || fullName.includes('pullover') || fullName.includes('t바') || fullName.includes('t-bar') || fullName.includes('데드리프트') || fullName.includes('deadlift')) {
      subTarget_ko = '두께';
      subTarget_en = 'Thickness';
    } else {
      subTarget_ko = '두께';
      subTarget_en = 'Thickness';
    }
  } else if (bodyPart === '어깨') {
    if (fullName.includes('프론트') || fullName.includes('front') || fullName.includes('밀리터리') || fullName.includes('military') || fullName.includes('오버헤드') || fullName.includes('overhead') || fullName.includes('아놀드') || fullName.includes('arnold') || (fullName.includes('프레스') && !fullName.includes('비하인드'))) {
      subTarget_ko = '전면';
      subTarget_en = 'Front';
    } else if (fullName.includes('리어') || fullName.includes('rear') || fullName.includes('후면') || fullName.includes('reverse fly') || fullName.includes('페이스풀') || fullName.includes('face pull')) {
      subTarget_ko = '후면';
      subTarget_en = 'Rear';
    } else {
      subTarget_ko = '측면';
      subTarget_en = 'Side';
    }
  } else if (bodyPart === '하체') {
    if (fullName.includes('카프') || fullName.includes('calf')) {
      subTarget_ko = '종아리';
      subTarget_en = 'Calves';
    } else if (fullName.includes('컬') || fullName.includes('curl') || fullName.includes('데드리프트') || fullName.includes('deadlift') || fullName.includes('힙') || fullName.includes('hip') || fullName.includes('둔근') || fullName.includes('glute') || fullName.includes('햄스트링') || fullName.includes('hamstring') || fullName.includes('브리지') || fullName.includes('bridge') || fullName.includes('어브덕션') || fullName.includes('abduction') || fullName.includes('어덕션') || fullName.includes('adduction')) {
      subTarget_ko = '햄스트링/둔근';
      subTarget_en = 'Hamstrings/Glutes';
    } else {
      subTarget_ko = '대퇴사두근';
      subTarget_en = 'Quads';
    }
  } else if (bodyPart === '팔') {
    if (fullName.includes('삼두') || fullName.includes('tricep') || fullName.includes('푸시다운') || fullName.includes('pushdown') || fullName.includes('킥백') || fullName.includes('kickback') || (fullName.includes('익스텐션') && !fullName.includes('컬')) || fullName.includes('딥스') || fullName.includes('dip') || fullName.includes('클로즈 그립 벤치')) {
      subTarget_ko = '삼두근';
      subTarget_en = 'Triceps';
    } else if (fullName.includes('리스트') || fullName.includes('wrist') || fullName.includes('전완') || fullName.includes('forearm')) {
      subTarget_ko = '전완근';
      subTarget_en = 'Forearms';
    } else {
      subTarget_ko = '이두근';
      subTarget_en = 'Biceps';
    }
  } else if (bodyPart === '코어' || bodyPart === '허리/코어') {
    if (fullName.includes('트위스트') || fullName.includes('twist') || fullName.includes('사이드') || fullName.includes('side') || fullName.includes('복사근') || fullName.includes('oblique') || fullName.includes('회전') || fullName.includes('rotation') || fullName.includes('힐터치') || fullName.includes('heel touch')) {
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
