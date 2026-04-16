export const BODY_PARTS = [
    { key: 'chest', label: '가슴' },
    { key: 'back', label: '등' },
    { key: 'shoulders', label: '어깨' },
    { key: 'upper legs', label: '하체(허벅지)' },
    { key: 'lower legs', label: '하체(종아리)' },
    { key: 'upper arms', label: '팔(상완)' },
    { key: 'lower arms', label: '팔(전완)' },
    { key: 'waist', label: '허리/코어' },
    { key: 'cardio', label: '유산소' },
    { key: 'neck', label: '목' }
];

export const PART_MAP = {
    chest: '가슴',
    back: '등',
    shoulders: '어깨',
    'upper legs': '하체',
    'lower legs': '종아리',
    'upper arms': '팔',
    'lower arms': '전완',
    waist: '코어',
    cardio: '유산소',
    neck: '목'
};

export const CATEGORIES = ['머신', '프리웨이트', '케이블'];

export const STORAGE_KEYS = {
    TODAY_ROUTINE: 'mygym_today_routine',
    CHAT_HISTORY: 'aiCoachChatHistory',
    USER_BODY_INFO: 'mygym_user_body_info'
};
