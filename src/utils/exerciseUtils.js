/**
 * 운동 데이터 관련 유틸리티 함수들
 * 이제 EXERCISE_DATASET을 직접 임포트하지 않고, 함수 호출 시 데이터를 주입받거나
 * 전역 윈도우 객체 등에 저장된 캐시를 활용할 수 있도록 설계합니다.
 */

export const BODY_PART_I18N = {
    '가슴': 'bodyParts.chest',
    '등': 'bodyParts.back',
    '어깨': 'bodyParts.shoulder',
    '하체': 'bodyParts.lower',
    '팔': 'bodyParts.arms',
    '허리/코어': 'bodyParts.core',
    '유산소': 'workout.cardio',
};

// 전역 캐시 변수 (앱 시작 시 한 번 저장됨)
let _cachedDataset = [];
export const setGlobalExerciseCache = (data) => { _cachedDataset = data; };
export const getGlobalExerciseCache = () => _cachedDataset;

export const getLocalizedName = (ex, lang) => {
    if (!ex) return '';
    return lang === 'en' && ex.name_en ? ex.name_en : ex.name;
};

export const getLocalizedNameById = (id, lang, fallbackName = '', dataset = _cachedDataset) => {
    if (!id) return fallbackName;
    const ex = dataset.find(e => e.id === id);
    if (!ex) return fallbackName;
    return lang === 'en' && ex.name_en ? ex.name_en : ex.name;
};

export const getLocalizedNameByKo = (koName, lang, dataset = _cachedDataset) => {
    if (!koName) return '';
    if (lang !== 'en') return koName;
    
    const targetName = koName.trim();
    const normalize = (s) => s.replace(/\s/g, '').toLowerCase();
    const targetNormalized = normalize(targetName);

    let ex = dataset.find(e => 
        e.name === targetName || 
        normalize(e.name) === targetNormalized
    );

    if (!ex && targetName.includes('(')) {
        const match = targetName.match(/^(.*?)\s*\((.*?)\)\s*$/);
        if (match) {
            const [, baseName, equipment] = match;
            const combinedName = `${equipment} ${baseName}`;
            const combinedNormalized = normalize(combinedName);
            
            ex = dataset.find(e => e.name === combinedName || normalize(e.name) === combinedNormalized);
            if (!ex) {
                const strippedNormalized = normalize(baseName);
                ex = dataset.find(e => e.name === baseName || normalize(e.name) === strippedNormalized);
            }
        }
    }

    if (!ex) {
        ex = dataset.find(e => targetNormalized.includes(normalize(e.name)) || normalize(e.name).includes(targetNormalized));
    }

    return ex?.name_en || koName;
};

export const getExerciseGif = (nameOrId, exerciseId, dataset = _cachedDataset) => {
    if (!nameOrId && !exerciseId) return null;

    if (exerciseId) {
        const ex = dataset.find(e => e.id === exerciseId);
        if (ex) return `/${ex.gif_url}`;
    }

    if (nameOrId) {
        const lower = nameOrId.toLowerCase();
        const ex = dataset.find(e => e.name_en?.toLowerCase() === lower || e.name.toLowerCase() === lower);
        if (ex) return `/${ex.gif_url}`;
    }

    return null;
};
