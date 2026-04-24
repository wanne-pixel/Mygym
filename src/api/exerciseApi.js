import { supabase } from './supabase';

/**
 * Supabase DB에서 전체 운동 목록을 가져옵니다.
 */
export const fetchAllExercises = async () => {
    try {
        const { data, error } = await supabase
            .from('exercises')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        // DB의 스네이크 케이스 컬럼명을 앱에서 사용하는 카멜 케이스로 매핑 (하위 호환성 유지)
        return data.map(ex => ({
            ...ex,
            bodyPart: ex.body_part,
            subTarget_ko: ex.sub_target_ko,
            subTarget_en: ex.sub_target_en,
            secondaryMuscles: ex.secondary_muscles,
            instructions: ex.instructions
        }));
    } catch (error) {
        console.error('[fetchAllExercises] 에러:', error);
        throw error;
    }
};

/**
 * 특정 부위의 운동 목록을 가져옵니다.
 */
export const fetchExercisesByBodyPart = async (bodyPart) => {
    try {
        const { data, error } = await supabase
            .from('exercises')
            .select('*')
            .eq('body_part', bodyPart)
            .order('name', { ascending: true });

        if (error) throw error;

        return data.map(ex => ({
            ...ex,
            bodyPart: ex.body_part,
            subTarget_ko: ex.sub_target_ko,
            subTarget_en: ex.sub_target_en,
            secondaryMuscles: ex.secondary_muscles,
            instructions: ex.instructions
        }));
    } catch (error) {
        console.error(`[fetchExercisesByBodyPart] ${bodyPart} 에러:`, error);
        throw error;
    }
};
