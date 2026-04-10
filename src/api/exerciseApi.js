const API_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const API_HOST = 'exercisedb.p.rapidapi.com';
const BASE_URL = `https://${API_HOST}`;

/**
 * Korean Translation Map for ExerciseDB data
 */
const translationMap = {
  // Body Parts
  "back": "등",
  "cardio": "유산소",
  "chest": "가슴",
  "lower arms": "하완(팔뚝)",
  "lower legs": "하퇴(종아리)",
  "neck": "목",
  "shoulders": "어깨",
  "upper arms": "상완(이두/삼두)",
  "upper legs": "대퇴(허벅지)",
  "waist": "허리",

  // Target Muscles
  "abductors": "외전근",
  "abs": "복근",
  "adductors": "내전근",
  "biceps": "이두근",
  "calves": "종아리근",
  "cardiovascular system": "심혈관계",
  "delts": "삼각근(어깨)",
  "forearms": "전완근",
  "glutes": "둔근(엉덩이)",
  "hamstrings": "햄스트링",
  "lats": "광배근",
  "levator scapulae": "견갑거근",
  "pectorals": "흉근(가슴)",
  "quads": "대퇴사두근",
  "serratus anterior": "전거근",
  "spine": "척추",
  "traps": "승모근",
  "triceps": "삼두근",
  "upper back": "등 상부",

  // Equipment
  "assisted": "보조 기구",
  "band": "밴드",
  "barbell": "바벨",
  "body weight": "맨몸",
  "bosu ball": "보수볼",
  "cable": "케이블",
  "dumbbell": "덤벨",
  "elliptical machine": "일립티컬",
  "ez barbell": "EZ 바벨",
  "hammer": "해머 머신",
  "kettlebell": "케틀벨",
  "leverage machine": "레버리지 머신",
  "medicine ball": "메디신볼",
  "olympic barbell": "올림픽 바벨",
  "resistance band": "저항 밴드",
  "roller": "롤러",
  "rope": "로프",
  "skater machine": "스케이터 머신",
  "sled machine": "슬레드 머신",
  "smith machine": "스미스 머신",
  "stability ball": "짐볼",
  "stationary bike": "싸이클",
  "stepmill machine": "천국의 계단",
  "tire": "타이어",
  "trap bar": "트랩바",
  "upper body ergometer": "상체 에르고미터",
  "weighted": "중량 추가",
  "wheel roller": "휠 롤러"
};

/**
 * Translates an English exercise term to Korean using the translationMap.
 * Returns the original term if no translation is found.
 * @param {string} term - The English term to translate
 * @returns {string} - The translated Korean term or the original English term
 */
export const translateExerciseTerm = (term) => {
  if (!term) return "";
  const lowerTerm = term.toLowerCase();
  return translationMap[lowerTerm] || term;
};

/**
 * Fetch exercises by body part from ExerciseDB API
 * @param {string} bodyPart - The body part to fetch exercises for (e.g., 'back', 'chest', 'cardio')
 * @returns {Promise<Array>} - Array of exercise objects
 */
export const fetchExercisesByBodyPart = async (bodyPart) => {
  const url = `${BASE_URL}/exercises/bodyPart/${bodyPart}`;
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': API_HOST
    }
  };

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch exercises:', error);
    throw error;
  }
};
