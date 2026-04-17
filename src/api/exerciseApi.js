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

  // Equipment & Common Terms
  "assisted": "어시스트",
  "band": "밴드",
  "barbell": "바벨",
  "body weight": "맨몸",
  "bodyweight": "맨몸",
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
  "weighted": "중량",
  "wheel roller": "휠 롤러",
  
  // Action & Form Terms
  "press": "프레스",
  "raise": "레이즈",
  "fly": "플라이",
  "curl": "컬",
  "extension": "익스텐션",
  "squat": "스쿼트",
  "deadlift": "데드리프트",
  "lunge": "런지",
  "row": "로우",
  "pulldown": "풀다운",
  "push": "푸시",
  "pull": "풀",
  "kickback": "킥백",
  "crunch": "크런치",
  "sit-up": "윗몸일으키기",
  "situp": "윗몸일으키기",
  "twist": "트위스트",
  "lever": "레버",
  "alternated": "얼터네이트",
  "alternate": "얼터네이트",
  "single": "싱글",
  "double": "더블",
  "lying": "라이잉",
  "bent": "벤트",
  "up": "업",
  "down": "다운",
  "around": "어라운드",
  "world": "월드",
  "step": "스텝",
  "jump": "점프",
  "plank": "플랭크",
  "hold": "홀드",
  "stretch": "스트레칭",
  "cross": "크로스",
  "variation": "바리에이션",
  
  // Body Parts (Additional)
  "calf": "카프",
  "wrist": "리스트",
  "shoulder": "숄더",
  "leg": "레그",
  "arm": "팔",
  
  // Misc
  "front": "프론트",
  "lateral": "레터럴",
  "reverse": "리버스",
  "overhead": "오버헤드",
  "seated": "시티드",
  "standing": "스탠딩",
  "incline": "인클라인",
  "decline": "디클라인",
  "machine": "머신",
  "smith": "스미스",
  "bench": "벤치",
  "pull-up": "풀업",
  "push-up": "푸쉬업",
  "dip": "딥스",
  "bent": "벤트",
  "over": "오버",
  "one": "원",
  "close": "클로즈",
  "grip": "그립",
  "wide": "와이드",
  "neutral": "뉴트럴",
  "straight": "스트레이트",
  "behind": "비하인드",
  "the": "",
  "with": "",
  "on": "",
  "to": "",
  "of": "",
  "and": ""
};

/**
 * Translates an English exercise name into Korean by splitting words and matching with dictionary.
 * Words not found in the dictionary are kept as original (uppercase for English).
 * @param {string} englishName - The full English name of the exercise
 * @returns {string} - The translated Korean name
 */
export const translateToKorean = (englishName) => {
  if (!englishName) return "";
  
  // Clean string but keep hyphens for words like sit-up
  const cleanedName = englishName.toLowerCase().replace(/[^a-z0-9-\s]/g, '');
  
  // Split by spaces
  const words = cleanedName.split(/\s+/);
  
  const translatedWords = words.map(word => {
    if (!word) return "";
    
    // 1. Try whole word (might include hyphens)
    if (translationMap[word] !== undefined) {
      return translationMap[word];
    }
    
    // 2. If it has hyphens, try splitting by hyphens as well
    if (word.includes('-')) {
      const subWords = word.split('-');
      const translatedSubWords = subWords.map(sw => {
        if (translationMap[sw] !== undefined) return translationMap[sw];
        return sw.toUpperCase();
      });
      return translatedSubWords.filter(w => w !== "").join(" ");
    }
    
    // Otherwise keep as original, uppercase for English words
    return word.toUpperCase();
  });
  
  // Filter out empty strings and join
  return translatedWords.filter(w => w !== "").join(" ");
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
