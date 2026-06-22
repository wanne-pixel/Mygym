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
    const [personalRecords, setPersonalRecords] = useState({});
    const [workoutPreferences, setWorkoutPreferences] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchExercisePersonalRecords = async (userId) => {
        try {
            const { data: logs } = await supabase
                .from('workout_logs')
                .select('exercise, sets_data')
                .eq('user_id', userId);

            if (!logs || logs.length === 0) return {};

            const records = {};
            // First pass: collect all weights per exercise
            const exerciseWeights = {};

            logs.forEach(log => {
                const exerciseName = log.exercise;
                let sets = Array.isArray(log.sets_data) ? log.sets_data : JSON.parse(log.sets_data || '[]');
                
                if (!records[exerciseName]) {
                    records[exerciseName] = { kg: 0, reps: 0, maxKgCount: 0, predictedStep: 5 };
                    exerciseWeights[exerciseName] = new Set();
                }

                sets.forEach(set => {
                    const kg = parseFloat(set.kg) || 0;
                    const reps = parseInt(set.reps) || 0;
                    
                    // Only count as PR if reps >= 10
                    if (kg > 0 && reps >= 10) {
                        exerciseWeights[exerciseName].add(kg);

                        if (kg > records[exerciseName].kg) {
                            records[exerciseName].kg = kg;
                            records[exerciseName].reps = reps;
                            records[exerciseName].maxKgCount = 1;
                        } else if (kg === records[exerciseName].kg) {
                            records[exerciseName].maxKgCount += 1;
                        }
                    }
                });
            });

            // Second pass: Calculate predicted step based on minimum difference between unique weights
            Object.keys(exerciseWeights).forEach(ex => {
                const uniqueWeights = Array.from(exerciseWeights[ex]).sort((a, b) => a - b);
                let minDiff = null;
                for (let i = 1; i < uniqueWeights.length; i++) {
                    const diff = uniqueWeights[i] - uniqueWeights[i - 1];
                    if (diff >= 1 && (!minDiff || diff < minDiff)) {
                        minDiff = diff;
                    }
                }
                
                if (minDiff) {
                    records[ex].predictedStep = minDiff;
                } else if (records[ex].kg > 0) {
                    // Fallback to 10% if only one weight exists
                    records[ex].predictedStep = Math.max(2.5, Math.round((records[ex].kg * 0.1) / 2.5) * 2.5);
                }
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
                    .select('active_program, workout_preferences')
                    .eq('user_id', session.user.id)
                    .maybeSingle();
                
                if (error) throw error;
                if (profile?.workout_preferences) {
                    setWorkoutPreferences(profile.workout_preferences);
                }
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
        return <AiWizard onSave={handleSaveProgram} personalRecords={personalRecords} workoutPreferences={workoutPreferences} user={user} />;
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
