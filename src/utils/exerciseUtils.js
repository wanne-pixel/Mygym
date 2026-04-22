import EXERCISE_DATASET from '../data/exercises.json';

export const BODY_PART_I18N = {
    '가슴': 'bodyParts.chest',
    '등': 'bodyParts.back',
    '어깨': 'bodyParts.shoulder',
    '하체': 'bodyParts.lower',
    '팔': 'bodyParts.arms',
    '허리/코어': 'bodyParts.core',
    '유산소': 'workout.cardio',
};

// exercise 객체를 받아 현재 언어에 맞는 이름 반환
export const getLocalizedName = (ex, lang) => {
    if (!ex) return '';
    return lang === 'en' && ex.name_en ? ex.name_en : ex.name;
};

// exercise ID로 현재 언어에 맞는 이름 반환
export const getLocalizedNameById = (id, lang, fallbackName = '') => {
    if (!id) return fallbackName;
    const ex = EXERCISE_DATASET.find(e => e.id === id);
    if (!ex) return fallbackName;
    return lang === 'en' && ex.name_en ? ex.name_en : ex.name;
};

// DB에 저장된 한국어 이름으로 데이터셋을 조회해 현재 언어 이름 반환
export const getLocalizedNameByKo = (koName, lang) => {
    if (!koName) return '';
    if (lang !== 'en') return koName;
    
    const targetName = koName.trim();
    
    // 1. 단순 정규화 매칭 (공백 제거)
    const normalize = (s) => s.replace(/\s/g, '').toLowerCase();
    const targetNormalized = normalize(targetName);

    let ex = EXERCISE_DATASET.find(e => 
        e.name === targetName || 
        normalize(e.name) === targetNormalized
    );

    // 2. 괄호 내용 처리 (예: "데드리프트 (바벨)" -> "바벨 데드리프트" 또는 "데드리프트")
    if (!ex && targetName.includes('(')) {
        const match = targetName.match(/^(.*?)\s*\((.*?)\)\s*$/);
        if (match) {
            const [, baseName, equipment] = match;
            const combinedName = `${equipment} ${baseName}`;
            const combinedNormalized = normalize(combinedName);
            
            ex = EXERCISE_DATASET.find(e => 
                e.name === combinedName || 
                normalize(e.name) === combinedNormalized
            );

            if (!ex) {
                const strippedNormalized = normalize(baseName);
                ex = EXERCISE_DATASET.find(e => 
                    e.name === baseName || 
                    normalize(e.name) === strippedNormalized
                );
            }
        }
    }

    // 3. 특정 키워드 포함 매칭 (데이터셋 이름이 타겟 이름을 포함하거나 반대인 경우)
    if (!ex) {
        ex = EXERCISE_DATASET.find(e => 
            targetNormalized.includes(normalize(e.name)) || 
            normalize(e.name).includes(targetNormalized)
        );
    }

    if (ex?.name_en) {
        return ex.name_en;
    }

    // 번역 실패 시 디버깅 로그 출력 (한 번만 출력되도록 메모리상 체크는 생략하고 경고로 표시)
    if (lang === 'en') {
        console.warn(`[Translation Failed] No matching English name for: "${koName}"`);
    }
    
    return koName;
};

export const getExerciseGif = (nameOrId, exerciseId) => {
    if (!nameOrId && !exerciseId) return null;

    if (exerciseId) {
        const ex = EXERCISE_DATASET.find(e => e.id === exerciseId);
        if (ex) return `/${ex.gif_url}`;
    }

    if (nameOrId) {
        const lower = nameOrId.toLowerCase();
        const ex = EXERCISE_DATASET.find(e =>
            e.name_en?.toLowerCase() === lower || e.name.toLowerCase() === lower
        );
        if (ex) return `/${ex.gif_url}`;
    }

    return null;
};
