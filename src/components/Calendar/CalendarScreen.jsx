import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, X } from 'lucide-react';
import { supabase } from '../../api/supabase';
import { STORAGE_KEYS } from '../../constants/exerciseConstants';
import { useWindowSize } from '../../hooks/useWindowSize';
import MonthlyCalendar from './MonthlyCalendar';
import DayDetailView from './DayDetailView';

const UserProfileModal = ({ isOpen, onClose, userData, onUpdate, isMobile }) => {
    const { t } = useTranslation();

    const [profile, setProfile] = useState({
        age: userData?.age || '',
        height: userData?.height || '',
        weight: userData?.weight || '',
        gender: userData?.gender || '',
        skeletal_muscle_mass: userData?.skeletal_muscle_mass || '',
        body_fat_mass: userData?.body_fat_mass || '',
        body_fat_percentage: userData?.body_fat_percentage || '',
        bmr: userData?.bmr || '',
        visceral_fat_level: userData?.visceral_fat_level || '',
        goals: userData?.goals || (userData?.goal ? [userData.goal] : ['strength']),
        weekly_frequency: userData?.weekly_frequency || 3
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && userData) {
            setProfile({
                age: userData.age || '',
                height: userData.height || '',
                weight: userData.weight || '',
                gender: userData.gender || '',
                skeletal_muscle_mass: userData.skeletal_muscle_mass || '',
                body_fat_mass: userData.body_fat_mass || '',
                body_fat_percentage: userData.body_fat_percentage || '',
                bmr: userData.bmr || '',
                visceral_fat_level: userData.visceral_fat_level || '',
                goals: userData.goals || (userData.goal ? [userData.goal] : ['strength']),
                weekly_frequency: userData.weekly_frequency || 3
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
            if (prev.goals.length >= 2) {
                // 이미 2개면 가장 먼저 선택한 걸 버리고 새 거 추가 (또는 그냥 무시할 수도 있지만 토글이 더 자연스러움)
                // 여기서는 2개 제한 안내가 있으니 추가를 막는 방식으로 구현
                return prev;
            }
            return { ...prev, goals: [...prev.goals, value] };
        });
    };

    const handleSave = async () => {
        if (profile.goals.length === 0) {
            alert(t('onboarding.goal.maxSelect'));
            return;
        }

        setIsSaving(true);
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session.session) throw new Error(t('common.loginRequired'));
            const userId = session.session.user.id;

            // 하위 호환성을 위해 첫 번째 목표를 goal 필드에도 저장
            const primaryGoal = profile.goals[0];

            await supabase.auth.updateUser({
                data: {
                    goal: primaryGoal,
                    goals: profile.goals,
                    age: profile.age,
                    gender: profile.gender,
                    height: profile.height,
                    weight: profile.weight
                }
            });

            const updatePayload = {
                goal: primaryGoal,
                goals: profile.goals,
                weekly_frequency: parseInt(profile.weekly_frequency) || 3,
                height: profile.height ? parseInt(profile.height) : null,
                weight: profile.weight ? parseFloat(profile.weight) : null,
                age: profile.age ? parseInt(profile.age) : null,
                gender: profile.gender || null,
                experience_level: userData?.experience_level || 'beginner',
                equipment_access: userData?.equipment_access || 'full_gym',
                limitations: userData?.limitations || []
            };

            const { error: profileError } = await supabase
                .from('user_profiles')
                .update(updatePayload)
                .eq('user_id', userId);

            if (profileError) throw profileError;

            localStorage.setItem(STORAGE_KEYS.USER_BODY_INFO, JSON.stringify(profile));
            alert(t('calendar.profileSaved'));
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Update Error:', error);
            alert(t('calendar.saveFailed') + (error.message || ''));
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

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-white italic text-shadow">{t('calendar.editProfile')}</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="space-y-3">
                        <div className="flex justify-between items-end">
                            <label className="text-[10px] font-black text-slate-500 uppercase block tracking-widest">{t('calendar.profileFields.goal')}</label>
                            <span className="text-[9px] font-bold text-slate-600 uppercase">{t('onboarding.goal.maxSelect')}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {goalOptions.map(opt => {
                                const isSelected = profile.goals.includes(opt.key);
                                return (
                                    <button
                                        key={opt.key}
                                        onClick={() => toggleGoal(opt.key)}
                                        className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border-2 ${
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

                    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        <div className="col-span-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">{t('calendar.profileFields.weeklyFrequency')}</label>
                            <input
                                type="number"
                                min="1"
                                max="7"
                                value={profile.weekly_frequency}
                                onChange={e => setProfile({...profile, weekly_frequency: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">{t('calendar.profileFields.age')}</label>
                            <input type="number" value={profile.age} onChange={e => setProfile({...profile, age: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold" placeholder={t('calendar.profileFields.ageSuffix')} />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">{t('calendar.profileFields.gender')}</label>
                            <select value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold">
                                <option value="">{t('common.select')}</option>
                                <option value="male">{t('common.male')}</option>
                                <option value="female">{t('common.female')}</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">{t('calendar.profileFields.height')}</label>
                            <input type="number" value={profile.height} onChange={e => setProfile({...profile, height: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold" placeholder={t('calendar.profileFields.heightUnit')} />
                        </div>
                        <div className="col-span-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">{t('calendar.profileFields.weight')}</label>
                            <input type="number" value={profile.weight} onChange={e => setProfile({...profile, weight: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold" placeholder={t('calendar.profileFields.weightUnit')} />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                        <label className="text-[10px] font-black text-blue-400 uppercase block mb-4 tracking-widest italic">{t('calendar.profileFields.inbody')}</label>
                        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">{t('calendar.profileFields.skeletalMuscle')}</label>
                                <input type="number" value={profile.skeletal_muscle_mass} onChange={e => setProfile({...profile, skeletal_muscle_mass: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">{t('calendar.profileFields.bodyFat')}</label>
                                <input type="number" value={profile.body_fat_mass} onChange={e => setProfile({...profile, body_fat_mass: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">{t('calendar.profileFields.bodyFatPercent')}</label>
                                <input type="number" value={profile.body_fat_percentage} onChange={e => setProfile({...profile, body_fat_percentage: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">{t('calendar.profileFields.bmr')}</label>
                                <input type="number" value={profile.bmr} onChange={e => setProfile({...profile, bmr: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">{t('calendar.profileFields.visceralFat')}</label>
                                <input type="number" value={profile.visceral_fat_level} onChange={e => setProfile({...profile, visceral_fat_level: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-3">
                        <button onClick={onClose} className={`flex-1 bg-slate-800 text-white font-black rounded-xl transition-all hover:bg-slate-700 italic uppercase tracking-widest ${isMobile ? 'py-4 text-sm' : 'py-3 text-xs'}`}>{t('common.cancel')}</button>
                        <button onClick={handleSave} disabled={isSaving} className={`flex-1 bg-blue-600 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50 italic uppercase tracking-widest ${isMobile ? 'py-4 text-sm' : 'py-3 text-xs'}`}>{isSaving ? t('common.saving') : t('common.save')}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CalendarScreen = () => {
    const { t, i18n } = useTranslation();
    const { isMobile } = useWindowSize();
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentViewDate, setCurrentViewDate] = useState(new Date());
    const [workoutGroups, setWorkoutGroups] = useState({});
    const [userData, setUserData] = useState(null);
    const [showProfileEdit, setShowProfileEdit] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);

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
                    onGoToRoutine={() => setSearchParams({ tab: '루틴구성', date: selectedDate })}
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
