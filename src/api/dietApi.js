import { supabase } from './supabase';

export const fetchDietLogs = async (userId, startDate, endDate) => {
    const { data, error } = await supabase
        .from('diet_logs')
        .select('*')
        .eq('user_id', userId)
        .gte('log_date', startDate)
        .lte('log_date', endDate);
        
    if (error) {
        console.error('Error fetching diet logs:', error);
        throw error;
    }
    return data;
};

export const fetchDietLogByDate = async (userId, dateStr) => {
    const { data, error } = await supabase
        .from('diet_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('log_date', dateStr)
        .maybeSingle();

    if (error) {
        console.error('Error fetching diet log:', error);
        throw error;
    }
    return data;
};

export const upsertDietLog = async (userId, dateStr, meals, waterMl) => {
    const payload = {
        user_id: userId,
        log_date: dateStr,
        meals: meals,
        water_ml: waterMl,
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('diet_logs')
        .upsert(payload, { onConflict: 'user_id, log_date' })
        .select()
        .maybeSingle();

    if (error) {
        console.error('Error upserting diet log:', error);
        throw error;
    }
    return data;
};

export const updateDietGoals = async (userId, goals) => {
    const { data, error } = await supabase
        .from('user_profiles')
        .update({ diet_goals: goals })
        .eq('user_id', userId)
        .select()
        .maybeSingle();
        
    if (error) {
        console.error('Error updating diet goals:', error);
        throw error;
    }
    return data;
};
