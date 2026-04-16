import { supabase } from './supabase';

/**
 * Fetches the last workout record for a specific exercise from Supabase.
 * @param {string} userId - The ID of the current user.
 * @param {string} exerciseName - The name of the exercise.
 * @returns {Promise<Object|null>} - The last record's sets_data or null.
 */
export const fetchLastExerciseRecord = async (userId, exerciseName) => {
    if (!userId || !exerciseName) return null;

    try {
        const { data, error } = await supabase
            .from('workout_logs')
            .select('sets_data')
            .eq('user_id', userId)
            .eq('exercise', exerciseName)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) throw error;
        
        if (data && data.length > 0) {
            const lastSets = data[0].sets_data;
            if (lastSets && lastSets.length > 0) {
                return lastSets[0];
            }
        }
        return null;
    } catch (err) {
        console.error("Error fetching last record in workoutApi:", err);
        return null;
    }
};

/**
 * Saves a workout log to Supabase.
 * @param {Object} logData - The workout log data to save.
 * @returns {Promise<boolean>} - Whether the save was successful.
 */
export const saveWorkoutLog = async (logData) => {
    try {
        const { error } = await supabase
            .from('workout_logs')
            .insert([logData]);
        if (error) throw error;
        return true;
    } catch (err) {
        console.error("Error saving workout log:", err);
        return false;
    }
};
