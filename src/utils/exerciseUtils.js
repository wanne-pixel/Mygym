import EXERCISE_DATASET from '../data/exercises.json';

/**
 * [Utility: Perfect GIF Matching]
 */
export const getExerciseGif = (nameEn, exerciseId) => {
    if (!nameEn && !exerciseId) return null;
    
    // 1. ID가 있으면 최우선으로 매칭 (가장 정확)
    if (exerciseId) {
        const ex = EXERCISE_DATASET.find(e => e.id === exerciseId);
        if (ex) return `/${ex.gif_url}`;
    }
    
    // 2. 이름으로 정확히 일치하는 항목 찾기
    if (nameEn) {
        const ex = EXERCISE_DATASET.find(e => e.nameEn?.toLowerCase() === nameEn.toLowerCase() || e.name.toLowerCase() === nameEn.toLowerCase());
        if (ex) return `/${ex.gif_url}`;
    }

    return null;
};
