import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../api/supabase';
import { toast } from 'sonner';
import AiWizard from './AiWizard';
import AiDashboard from './AiDashboard';

const WorkoutPlanScreen = () => {
    const { t } = useTranslation();

    const [user, setUser] = useState(null);
    const [activeProgram, setActiveProgram] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [personalRecords, setPersonalRecords] = useState({});

    const fetchExercisePersonalRecords = async (userId) => {
        try {
            const { data: logs } = await supabase
                .from('workout_logs')
                .select('exercise, sets_data')
                .eq('user_id', userId);

            if (!logs || logs.length === 0) return {};

            const records = {};
            logs.forEach(log => {
                const exerciseName = log.exercise;
                let sets = Array.isArray(log.sets_data) ? log.sets_data : JSON.parse(log.sets_data || '[]');
                sets.forEach(set => {
                    const kg = parseFloat(set.kg) || 0;
                    const reps = parseInt(set.reps) || 0;
                    if (!records[exerciseName] || kg > records[exerciseName].kg) {
                        records[exerciseName] = { kg, reps };
                    }
                });
            });
            return records;
        } catch (e) {
            console.error('[PR] 조회 실패:', e);
            return {};
        }
    };

    const loadUserDataAndProgram = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                setUser(session.user);
                
                const records = await fetchExercisePersonalRecords(session.user.id);
                setPersonalRecords(records);

                const { data: profile, error } = await supabase
                    .from('user_profiles')
                    .select('active_program')
                    .eq('user_id', session.user.id)
                    .maybeSingle();
                
                if (error) throw error;
                if (profile && profile.active_program) {
                    setActiveProgram(profile.active_program);
                } else {
                    setActiveProgram(null);
                }
            }
        } catch (err) {
            console.error("Error loading user profile & program:", err);
            toast.error(t('common.serverDelay', 'Server delay'));
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadUserDataAndProgram();
    }, []);

    const handleSaveProgram = async (newProgram) => {
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ active_program: newProgram })
                .eq('user_id', user.id);
            if (error) throw error;
            setActiveProgram(newProgram);
            toast.success(t('workout.saveSuccess', 'Program saved!'));
        } catch (err) {
            console.error("Error starting program:", err);
            toast.error(t('workout.saveFailed', 'Failed to save program: ') + err.message);
        }
    };

    const handleQuitLegacy = async () => {
        if (!window.confirm('Are you sure you want to quit the legacy program?')) return;
        try {
            const { error } = await supabase
                .from('user_profiles')
                .update({ active_program: null })
                .eq('user_id', user.id);
            if (error) throw error;
            setActiveProgram(null);
        } catch (err) {
            console.error(err);
            toast.error(err.message);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 gap-4 text-white">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 text-sm font-bold animate-pulse uppercase tracking-widest">{t('common.loading', 'Loading...')}</p>
            </div>
        );
    }

    if (!activeProgram) {
        return <AiWizard onSave={handleSaveProgram} />;
    }

    if (activeProgram.type === 'weekly_ai') {
        return (
            <AiDashboard 
                activeProgram={activeProgram} 
                user={user} 
                personalRecords={personalRecords} 
                setActiveProgram={setActiveProgram} 
            />
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 gap-4 text-white p-8 text-center">
            <h2 className="text-2xl font-black italic text-white uppercase mb-4">Legacy Program Detected</h2>
            <p className="text-slate-400 mb-8">You are currently on an older manual template format. Please reset your program to use the new AI Routine builder.</p>
            <button
                onClick={handleQuitLegacy}
                className="px-8 py-4 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-2xl italic tracking-tight transition-all active:scale-[0.98] shadow-lg shadow-rose-600/30"
            >
                Reset Program
            </button>
        </div>
    );
};

export default WorkoutPlanScreen;
