import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../api/supabase';
import { STORAGE_KEYS } from '../../constants/exerciseConstants';
import { useWindowSize } from '../../hooks/useWindowSize';
import MonthlyCalendar from './MonthlyCalendar';
import DayDetailView from './DayDetailView';

const UserProfileModal = ({ isOpen, onClose, userData, onUpdate, isMobile }) => {
    const { t } = useTranslation();

    const [profile, setProfile] = useState({
        nickname: userData?.nickname || userData?.full_name || '',
        goals: userData?.goals || (userData?.goal ? [userData.goal] : ['strength']),
        weekly_frequency: userData?.weekly_frequency || 3,
        experience_level: userData?.experience_level || 'beginner',
        available_time: userData?.available_time || '30분~1시간',
        limitations: userData?.limitations || [],
        gender: userData?.gender || 'male',
        age: userData?.age || '',
        height: userData?.height || '',
        weight: userData?.weight || '',
        activity_level: userData?.activity_level || 'sedentary',
        // Workout style preferences
        pref_days_per_week: userData?.workout_preferences?.days_per_week || 4,
        pref_exercises_per_session: userData?.workout_preferences?.exercises_per_session || 6,
        pref_sets_per_exercise: userData?.workout_preferences?.sets_per_exercise || 5,
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && userData) {
            setProfile({
                nickname: userData.nickname || userData.full_name || '',
                goals: userData.goals || (userData.goal ? [userData.goal] : ['strength']),
                weekly_frequency: userData.weekly_frequency || 3,
                experience_level: userData.experience_level || 'beginner',
                available_time: userData.available_time || '30분~1시간',
                limitations: userData.limitations || [],
                gender: userData.gender || 'male',
                age: userData.age || '',
                height: userData.height || '',
                weight: userData.weight || '',
                activity_level: userData.activity_level || 'sedentary',
                pref_days_per_week: userData.workout_preferences?.days_per_week || 4,
                pref_exercises_per_session: userData.workout_preferences?.exercises_per_session || 6,
                pref_sets_per_exercise: userData.workout_preferences?.sets_per_exercise || 5,
            });
        }
    }, [isOpen, userData]);

    if (!isOpen) return null;

    const toggleGoal = (value) => {
        setProfile(prev => {
            const isSelected = prev.goals.includes(value);
            if (isSelected) {
                return { ...prev, goals: prev.goals.filter(g => g !== value) };
            }
            if (prev.goals.length >= 2) return prev;
            return { ...prev, goals: [...prev.goals, value] };
        });
    };

    const toggleLimitation = (limit) => {
        setProfile(prev => ({
            ...prev,
            limitations: prev.limitations.includes(limit)
                ? prev.limitations.filter(l => l !== limit)
                : [...prev.limitations, limit]
        }));
    };

    const handleSave = async () => {
        if (!profile.nickname?.trim()) {
            toast.error(t('calendar.profileFields.nickname') + ' ' + t('common.required'));
            return;
        }

        if (profile.goals.length === 0) {
            toast.error(t('onboarding.goal.maxSelect'));
            return;
        }

        setIsSaving(true);
        try {
            const { data: sessionData } = await supabase.auth.getSession();
            if (!sessionData.session) throw new Error(t('common.loginRequired'));
            const userId = sessionData.session.user.id;

            const primaryGoal = profile.goals[0];

            // 1. Auth Metadata 업데이트 (닉네임 및 기본 정보)
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    nickname: profile.nickname,
                    goal: primaryGoal,
                    goals: profile.goals,
                }
            });
            if (authError) throw authError;

            // 2. user_profiles 테이블 업데이트
            const updatePayload = {
                goal: primaryGoal,
                goals: profile.goals,
                weekly_frequency: parseInt(profile.weekly_frequency) || 3,
                experience_level: profile.experience_level,
                available_time: profile.available_time,
                limitations: profile.limitations,
                gender: profile.gender,
                age: profile.age ? parseInt(profile.age) : null,
                height: profile.height ? parseFloat(profile.height) : null,
                weight: profile.weight ? parseFloat(profile.weight) : null,
                activity_level: profile.activity_level,
                workout_preferences: {
                    days_per_week: parseInt(profile.pref_days_per_week) || 4,
                    exercises_per_session: parseInt(profile.pref_exercises_per_session) || 6,
                    sets_per_exercise: parseInt(profile.pref_sets_per_exercise) || 5,
                }
            };

            const { error: profileError } = await supabase
                .from('user_profiles')
                .update(updatePayload)
                .eq('user_id', userId);

            if (profileError) throw profileError;

            // 3. 로컬 저장소 및 UI 상태 동기화
            localStorage.setItem(STORAGE_KEYS.USER_BODY_INFO, JSON.stringify(profile));
            localStorage.setItem('USER_BODY_INFO', JSON.stringify(profile));
            toast.success(t('calendar.profileSaved'));
            
            await onUpdate(); // 최신 데이터 다시 불러오기
            onClose(); // 모달 닫기
        } catch (error) {
            console.error('[Profile Update Error]:', error);
            toast.error(t('calendar.saveFailed') + (error.message ? `: ${error.message}` : ''));
        } finally {
            setIsSaving(false);
        }
    };

    const goalOptions = [
        { key: 'strength', label: t('onboarding.goal.strength') },
        { key: 'hypertrophy', label: t('onboarding.goal.hypertrophy') },
        { key: 'weight_loss', label: t('onboarding.goal.weightLoss') },
        { key: 'maintenance', label: t('onboarding.goal.maintenance') }
    ];

    const levelOptions = [
        { key: 'beginner', label: t('onboarding.level.beginner') },
        { key: 'intermediate', label: t('onboarding.level.intermediate') },
        { key: 'advanced', label: t('onboarding.level.advanced') }
    ];

    const timeOptions = [
        { key: '30분 이하', label: t('onboarding.availableTime.under30') },
        { key: '30분~1시간', label: t('onboarding.availableTime.30to60') },
        { key: '1시간~1.5시간', label: t('onboarding.availableTime.60to90') },
        { key: '1.5시간 이상', label: t('onboarding.availableTime.over90') }
    ];

    const limitOptions = [
        { key: 'knee', label: t('onboarding.limitations.knee') },
        { key: 'back', label: t('onboarding.limitations.lowerBack') },
        { key: 'shoulder', label: t('onboarding.limitations.shoulder') },
        { key: 'wrist', label: t('onboarding.limitations.wrist') }
    ];

    return (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-slate-900 border-t sm:border border-white/10 w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto custom-scrollbar animate-slide-up sm:animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl sm:text-2xl font-black text-white italic text-shadow">{t('calendar.editProfile')}</h3>
                    <button onClick={onClose} className="p-2 -mr-2 text-slate-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-5 sm:space-y-6">
                    {/* 닉네임 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">{t('calendar.profileFields.nickname')}</label>
                        <input
                            type="text"
                            value={profile.nickname}
                            onChange={e => setProfile({...profile, nickname: e.target.value})}
                            className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-bold transition-all"
                            placeholder={t('calendar.profileFields.nickname')}
                        />
                    </div>

                    {/* 운동 목표 */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">{t('calendar.profileFields.goal')}</label>
                            <span className="text-[9px] font-bold text-slate-600 uppercase">{t('onboarding.goal.maxSelect')}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {goalOptions.map(opt => {
                                const isSelected = profile.goals.includes(opt.key);
                                return (
                                    <button
                                        key={opt.key}
                                        onClick={() => toggleGoal(opt.key)}
                                        className={`px-3 py-3 rounded-2xl text-xs font-black transition-all border-2 ${
                                            isSelected 
                                                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 운동 숙련도 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">{t('calendar.profileFields.experienceLevel')}</label>
                        <div className="grid grid-cols-3 gap-2">
                            {levelOptions.map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => setProfile({...profile, experience_level: opt.key})}
                                    className={`py-3 rounded-2xl text-[10px] font-black transition-all border-2 ${
                                        profile.experience_level === opt.key
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 성별 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">{t('calendar.profileFields.gender')}</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['male', 'female'].map(g => (
                                <button
                                    key={g}
                                    type="button"
                                    onClick={() => setProfile({...profile, gender: g})}
                                    className={`py-3 rounded-2xl text-[10px] font-black transition-all border-2 ${
                                        profile.gender === g
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20'
                                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                    }`}
                                >
                                    {t(`common.${g}`)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 신체 정보 */}
                    <div className="grid grid-cols-3 gap-2">
                        {/* 나이 */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">{t('calendar.profileFields.age')}</label>
                            <input
                                type="number"
                                value={profile.age || ''}
                                onChange={e => setProfile({...profile, age: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold transition-all"
                                placeholder={t('calendar.profileFields.age')}
                            />
                        </div>
                        {/* 키 */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">{t('calendar.profileFields.height')}</label>
                            <input
                                type="number"
                                step="0.1"
                                value={profile.height || ''}
                                onChange={e => setProfile({...profile, height: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold transition-all"
                                placeholder="cm"
                            />
                        </div>
                        {/* 몸무게 */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">{t('calendar.profileFields.weight')}</label>
                            <input
                                type="number"
                                step="0.1"
                                value={profile.weight || ''}
                                onChange={e => setProfile({...profile, weight: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold transition-all"
                                placeholder="kg"
                            />
                        </div>
                    </div>

                    {/* 활동량 */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">{t('calendar.profileFields.activityLevel')}</label>
                        <div className="relative">
                            <select
                                value={profile.activity_level || 'sedentary'}
                                onChange={e => setProfile({...profile, activity_level: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold appearance-none cursor-pointer"
                            >
                                <option value="sedentary">{t('calendar.profileFields.activityLevels.sedentary')}</option>
                                <option value="light">{t('calendar.profileFields.activityLevels.light')}</option>
                                <option value="moderate">{t('calendar.profileFields.activityLevels.moderate')}</option>
                                <option value="heavy">{t('calendar.profileFields.activityLevels.heavy')}</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* 주간 횟수 */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">{t('calendar.profileFields.weeklyFrequency')}</label>
                            <div className="relative">
                                <select
                                    value={profile.weekly_frequency}
                                    onChange={e => setProfile({...profile, weekly_frequency: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold appearance-none cursor-pointer"
                                >
                                    {[2,3,4,5,6,7].map(n => <option key={n} value={n}>{n}{t('onboarding.frequency.unit')}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                            </div>
                        </div>
                        {/* 가용 시간 */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">{t('calendar.profileFields.availableTime')}</label>
                            <div className="relative">
                                <select
                                    value={profile.available_time}
                                    onChange={e => setProfile({...profile, available_time: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl p-3.5 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold appearance-none cursor-pointer"
                                >
                                    {timeOptions.map(opt => <option key={opt.key} value={opt.key}>{opt.label}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                            </div>
                        </div>
                    </div>

                    {/* 부상/제한사항 */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">{t('calendar.profileFields.limitations')}</label>
                        <div className="grid grid-cols-2 gap-2">
                            {limitOptions.map(opt => {
                                const isSelected = profile.limitations.includes(opt.key);
                                return (
                                    <button
                                        key={opt.key}
                                        onClick={() => toggleLimitation(opt.key)}
                                        className={`px-3 py-3 rounded-2xl text-[10px] font-black transition-all border-2 ${
                                            isSelected 
                                                ? 'bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-600/20' 
                                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 🏋️ 운동 스타일 설정 */}
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                        <label className="text-[10px] font-black text-indigo-400 uppercase block tracking-widest">🏋️ 선호 운동 스타일</label>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">주당 운동일</label>
                                <select
                                    value={profile.pref_days_per_week}
                                    onChange={e => setProfile({...profile, pref_days_per_week: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    {[3,4,5,6].map(n => <option key={n} value={n}>{n}일</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">운동 수</label>
                                <select
                                    value={profile.pref_exercises_per_session}
                                    onChange={e => setProfile({...profile, pref_exercises_per_session: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    {[4,5,6,7,8].map(n => <option key={n} value={n}>{n}종목</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">세트 수</label>
                                <select
                                    value={profile.pref_sets_per_exercise}
                                    onChange={e => setProfile({...profile, pref_sets_per_exercise: e.target.value})}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs font-bold appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    {[3,4,5,6].map(n => <option key={n} value={n}>{n}세트</option>)}
                                </select>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 italic">* AI 루틴 생성 시 이 설정이 자동으로 반영됩니다.</p>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button onClick={onClose} className="flex-1 bg-slate-800 text-white font-black py-4 rounded-2xl transition-all hover:bg-slate-700 italic uppercase tracking-widest text-sm">{t('common.cancel')}</button>
                        <button onClick={handleSave} disabled={isSaving} className="flex-1 bg-blue-600 text-white font-black py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50 italic uppercase tracking-widest text-sm">{isSaving ? t('common.saving') : t('common.save')}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CalendarScreen = ({ onSelectedDateChange }) => {
    const { t, i18n } = useTranslation();
    const { isMobile } = useWindowSize();
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentViewDate, setCurrentViewDate] = useState(new Date());
    const [workoutGroups, setWorkoutGroups] = useState({});
    const [userData, setUserData] = useState(null);
    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        onSelectedDateChange?.(selectedDate);
    }, [selectedDate]);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            setUserData({ ...user.user_metadata, ...profile });

            const { data } = await supabase.from('workout_logs').select('*').eq('user_id', user.id);
            const groups = {};
            data?.forEach(log => {
                const date = new Date(log.created_at);
                const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
                if (!groups[key]) groups[key] = { logs: [] };
                groups[key].logs.push(log);
            });
            setWorkoutGroups(groups);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    useEffect(() => {
        localStorage.removeItem('availableEquipment');
        fetchLogs();
    }, []);

    const handleMonthChange = (off) => {
        setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + off, 1));
    };

    return (
        <div className={`${isMobile ? 'p-4' : 'p-8 max-w-6xl mx-auto'} flex flex-col bg-slate-950 min-h-screen pb-24`}>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">{t('calendar.appName')}</h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowProfileEdit(true)}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 bg-blue-500/10 px-3 py-2 rounded-xl transition-all border border-blue-500/20"
                    >
                        <User size={14} />
                        {t('calendar.profile')}
                    </button>
                    {/* 모바일 전용: 언어 전환 + 로그아웃 */}
                    <div className="lg:hidden flex items-center gap-2">
                        <LangSwitcherMobile />
                        <button
                            onClick={async () => {
                                if (window.confirm(t('nav.logoutConfirm'))) {
                                    await supabase.auth.signOut();
                                    localStorage.clear();
                                }
                            }}
                            className="p-2 bg-red-900/20 text-red-400 rounded-full hover:bg-red-900/40 transition-all active:scale-95"
                            title={t('nav.logout')}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {selectedDate ? (
                <DayDetailView
                    date={selectedDate}
                    onBack={() => setSelectedDate(null)}
                    onGoToRoutine={() => setSearchParams({ tab: '운동', date: selectedDate })}
                    isMobile={isMobile}
                />
            ) : (
                <MonthlyCalendar
                    workoutGroups={workoutGroups}
                    currentViewDate={currentViewDate}
                    onMonthChange={handleMonthChange}
                    onDayClick={(dateStr) => setSelectedDate(dateStr)}
                    isMobile={isMobile}
                />
            )}

            <UserProfileModal
                isOpen={showProfileEdit}
                onClose={() => setShowProfileEdit(false)}
                userData={userData}
                onUpdate={fetchLogs}
                isMobile={isMobile}
            />
        </div>
    );
};

const LangSwitcherMobile = () => {
    const { i18n } = useTranslation();
    const toggle = () => {
        const next = i18n.language === 'ko' ? 'en' : 'ko';
        i18n.changeLanguage(next);
        localStorage.setItem('mygym_lang', next);
    };
    return (
        <button
            onClick={toggle}
            className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-full transition-all active:scale-95 text-xs font-bold w-9 h-9 flex items-center justify-center"
        >
            {i18n.language === 'ko' ? 'EN' : '한'}
        </button>
    );
};

export default CalendarScreen;
