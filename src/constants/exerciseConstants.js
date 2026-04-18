export const BODY_PARTS = [
    { key: '가슴', label: '가슴' },
    { key: '등', label: '등' },
    { key: '어깨', label: '어깨' },
    { key: '하체', label: '하체' },
    { key: '팔', label: '팔' },
    { key: '허리/코어', label: '허리/코어' },
    { key: '유산소', label: '유산소' }
];

export const PART_MAP = {
    '가슴': '가슴',
    '등': '등',
    '어깨': '어깨',
    '하체': '하체',
    '팔': '팔',
    '허리/코어': '허리/코어',
    '유산소': '유산소',
    'back': '등',
    'cardio': '유산소',
    'chest': '가슴',
    'lower body': '하체',
    'shoulders': '어깨',
    'arms': '팔',
    'waist': '허리/코어'
};

export const EQUIPMENT_MAP = {
    'barbell': '바벨',
    'body weight': '맨몸',
    'cable': '케이블',
    'dumbbell': '덤벨',
    'leverage machine': '레버리지 머신',
    'smith machine': '스미스 머신',
    'sled machine': '슬레드 머신',
    'trap bar': '트랩바',
    'ez barbell': 'EZ바',
    'assisted': '어시스트',
    'weighted': '중량',
    'machine': '머신',
    'rope': '로프'
};

export const CATEGORIES = ['머신', '프리웨이트', '케이블'];

export const STORAGE_KEYS = {
    TODAY_ROUTINE: 'mygym_today_routine',
    CHAT_HISTORY: 'aiCoachChatHistory',
    USER_BODY_INFO: 'mygym_user_body_info'
};
