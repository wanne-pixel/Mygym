import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, X } from 'lucide-react';
import { supabase } from '../../api/supabase';
import { STORAGE_KEYS } from '../../constants/exerciseConstants';
import { useWindowSize } from '../../hooks/useWindowSize';
import MonthlyCalendar from './MonthlyCalendar';
import DayDetailView from './DayDetailView';

/**
 * [Common: User Profile Modal]
 */
const UserProfileModal = ({ isOpen, onClose, userData, onUpdate, isMobile }) => {
    if (!isOpen) return null;
    
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
        goal: userData?.goal || 'strength',
        weekly_frequency: userData?.weekly_frequency || 3
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { data: session } = await supabase.auth.getSession();
            if (!session.session) throw new Error('로그인이 필요합니다.');
            const userId = session.session.user.id;

            // 1. Auth Metadata 업데이트 (일부 정보 중복 보관)
            await supabase.auth.updateUser({
                data: { 
                    goal: profile.goal,
                    age: profile.age,
                    gender: profile.gender,
                    height: profile.height,
                    weight: profile.weight
                }
            });

            // 2. user_profiles 테이블 업데이트
            // 400 에러 방지를 위해 존재하는 컬럼만 명확한 타입으로 전송
            const updatePayload = {
                goal: profile.goal,
                weekly_frequency: parseInt(profile.weekly_frequency) || 3,
                height: profile.height ? parseInt(profile.height) : null,
                weight: profile.weight ? parseFloat(profile.weight) : null,
                age: profile.age ? parseInt(profile.age) : null,
                gender: profile.gender || null,
                // 기존 데이터 유지 (누락 방지)
                experience_level: userData?.experience_level || 'beginner',
                equipment_access: userData?.equipment_access || 'full_gym',
                limitations: userData?.limitations || []
            };

            // 인바디 정보는 DB에 컬럼이 있을 때만 포함 (현재는 400 에러 원인으로 지목됨)
            // 만약 나중에 컬럼을 추가한다면 아래 주석을 해제하세요.
            /*
            Object.assign(updatePayload, {
                skeletal_muscle_mass: profile.skeletal_muscle_mass ? parseFloat(profile.skeletal_muscle_mass) : null,
                body_fat_mass: profile.body_fat_mass ? parseFloat(profile.body_fat_mass) : null,
                body_fat_percentage: profile.body_fat_percentage ? parseFloat(profile.body_fat_percentage) : null,
                bmr: profile.bmr ? parseInt(profile.bmr) : null,
                visceral_fat_level: profile.visceral_fat_level ? parseInt(profile.visceral_fat_level) : null
            });
            */

            const { error: profileError } = await supabase
                .from('user_profiles')
                .update(updatePayload)
                .eq('user_id', userId);

            if (profileError) throw profileError;

            localStorage.setItem(STORAGE_KEYS.USER_BODY_INFO, JSON.stringify(profile));
            alert('개인정보가 수정되었습니다.');
            onUpdate();
            onClose();
        } catch (error) {
            console.error('Update Error:', error);
            alert('저장 실패: ' + (error.message || '알 수 없는 에러가 발생했습니다.'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-white italic text-shadow">개인정보 수정</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                        <div className="col-span-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">운동 목표</label>
                            <select
                                value={profile.goal}
                                onChange={e => setProfile({...profile, goal: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold"
                            >
                                <option value="strength">근력 증가</option>
                                <option value="hypertrophy">근육 성장</option>
                                <option value="weight_loss">체중 감량</option>
                                <option value="maintenance">현상 유지</option>
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">주간 운동 횟수</label>
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
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">나이</label>
                            <input type="number" value={profile.age} onChange={e => setProfile({...profile, age: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold" placeholder="세" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">성별</label>
                            <select value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold">
                                <option value="">선택</option>
                                <option value="male">남성</option>
                                <option value="female">여성</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">키 (cm)</label>
                            <input type="number" value={profile.height} onChange={e => setProfile({...profile, height: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold" placeholder="cm" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">몸무게 (kg)</label>
                            <input type="number" value={profile.weight} onChange={e => setProfile({...profile, weight: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold" placeholder="kg" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                        <label className="text-[10px] font-black text-blue-400 uppercase block mb-4 tracking-widest italic">인바디 정보</label>
                        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">골격근량 (kg)</label>
                                <input type="number" value={profile.skeletal_muscle_mass} onChange={e => setProfile({...profile, skeletal_muscle_mass: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">체지방량 (kg)</label>
                                <input type="number" value={profile.body_fat_mass} onChange={e => setProfile({...profile, body_fat_mass: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">체지방률 (%)</label>
                                <input type="number" value={profile.body_fat_percentage} onChange={e => setProfile({...profile, body_fat_percentage: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">기초대사량 (kcal)</label>
                                <input type="number" value={profile.bmr} onChange={e => setProfile({...profile, bmr: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1 tracking-widest">내장지방레벨</label>
                                <input type="number" value={profile.visceral_fat_level} onChange={e => setProfile({...profile, visceral_fat_level: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-bold" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-3">
                        <button onClick={onClose} className={`flex-1 bg-slate-800 text-white font-black rounded-xl transition-all hover:bg-slate-700 italic uppercase tracking-widest ${isMobile ? 'py-4 text-sm' : 'py-3 text-xs'}`}>취소</button>
                        <button onClick={handleSave} disabled={isSaving} className={`flex-1 bg-blue-600 text-white font-black rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50 italic uppercase tracking-widest ${isMobile ? 'py-4 text-sm' : 'py-3 text-xs'}`}>{isSaving ? 'SAVING...' : '수정'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const CalendarScreen = () => {
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
        <div className={`${isMobile ? 'p-4' : 'p-8 max-w-5xl mx-auto'} flex flex-col bg-slate-950 min-h-screen pb-24`}>
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">MY GYM</h2>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowProfileEdit(true)}
                        className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 bg-blue-500/10 px-3 py-2 rounded-xl transition-all border border-blue-500/20"
                    >
                        <User size={14} />
                        개인정보
                    </button>
                    <button
                        onClick={async () => { if(window.confirm('로그아웃 하시겠습니까?')) { await supabase.auth.signOut(); localStorage.clear(); } }}
                        className="p-2 bg-red-900/20 text-red-400 rounded-full hover:bg-red-900/40 transition-all active:scale-95"
                        title="로그아웃"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
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

export default CalendarScreen;
