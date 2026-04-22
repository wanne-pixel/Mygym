import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../api/supabase';
import { PART_MAP } from '../../constants/exerciseConstants';
import { saveWorkoutLogs } from '../../api/workoutApi';
import ExerciseSelector from '../Exercise/ExerciseSelector';
import { GifModal, GifRenderer } from '../Common/GifUI';
import { useWindowSize } from '../../hooks/useWindowSize';

const WorkoutPlanScreen = () => {
    const { isMobile } = useWindowSize();
    const [searchParams, setSearchParams] = useSearchParams();
    const dateParam = searchParams.get('date');
    const targetDate = dateParam || new Date().toISOString().split('T')[0];
    const storageKey = `mygym_routine_${targetDate}`;
    const isToday = targetDate === new Date().toISOString().split('T')[0];

    const [selection, setSelection] = useState({ part: '', exercise: null, manualName: '' });
    const [planList, setPlanList] = useState(() => JSON.parse(localStorage.getItem(storageKey) || '[]'));
    const [modalState, setModalState] = useState({ isOpen: false, gifUrl: '', name: '' });
    const [isSaving, setIsSaving] = useState(false);
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

    useEffect(() => {
        const loadData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const uid = session.user.id;
                const records = await fetchExercisePersonalRecords(uid);
                setPersonalRecords(records);
            }
        };
        loadData();
    }, []);

    useEffect(() => {
        setPlanList(JSON.parse(localStorage.getItem(storageKey) || '[]'));
    }, [storageKey]);

    useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(planList)); }, [planList, storageKey]);

    const isCardio = (item) => item.body_part === '유산소' || item.body_part === 'cardio';

    const makeDefaultSet = (item, prevSet = null) => {
        if (isCardio(item)) return { level: prevSet?.level ?? '', minutes: prevSet?.minutes ?? '' };
        const kg = prevSet?.isDropSet ? (prevSet?.dropKgs?.[0] ?? '') : (prevSet?.kg ?? '');
        return { kg, reps: prevSet?.reps ?? '', isDropSet: false, dropKgs: ['', '', ''] };
    };

    const handleAddToList = () => {
        if (!selection.exercise) return;
        const newItem = { id: Date.now(), ...selection.exercise, body_part: selection.part, completed: false };
        newItem.sets = [makeDefaultSet(newItem)];
        setPlanList(prev => [...prev, newItem]);
        setSelection({ part: '', exercise: null, manualName: '' });
    };

    const toggleCompleted = (exIdx) => {
        setPlanList(prev => prev.map((item, i) => i === exIdx ? { ...item, completed: !item.completed } : item));
    };

    const updateSet = (exIdx, setIdx, field, value) => {
        setPlanList(prev => prev.map((item, i) => {
            if (i !== exIdx) return item;
            return { ...item, sets: item.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s) };
        }));
    };

    const addSet = (exIdx) => {
        setPlanList(prev => prev.map((item, i) => {
            if (i !== exIdx) return item;
            const prevSet = item.sets?.[item.sets.length - 1] ?? null;
            return { ...item, sets: [...(item.sets || []), makeDefaultSet(item, prevSet)] };
        }));
    };

    const removeSet = (exIdx, setIdx) => {
        setPlanList(prev => prev.map((item, i) => {
            if (i !== exIdx) return item;
            return { ...item, sets: item.sets.filter((_, j) => j !== setIdx) };
        }));
    };

    const toggleDropSet = (exIdx, setIdx) => {
        setPlanList(prev => prev.map((item, i) => {
            if (i !== exIdx) return item;
            return { ...item, sets: item.sets.map((s, j) => {
                if (j !== setIdx) return s;
                return s.isDropSet
                    ? { ...s, isDropSet: false, kg: s.dropKgs?.[0] ?? '' }
                    : { ...s, isDropSet: true, dropKgs: [s.kg, '', ''] };
            })};
        }));
    };

    const handleSaveWorkout = async () => {
        if (!window.confirm(`${isToday ? '오늘' : targetDate} 운동을 저장할까요?\n저장 후 운동 리스트가 초기화됩니다.`)) return;
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('로그인이 필요합니다.');

            const logsToSave = planList
                .map(item => {
                    const cardio = isCardio(item);
                    const filteredSets = (item.sets || []).filter(s => {
                        if (cardio) return s.level !== '' || s.minutes !== '';
                        if (s.isDropSet) return s.dropKgs?.some(k => k !== '') || s.reps !== '';
                        return s.kg !== '' || s.reps !== '';
                    });
                    return { ...item, sets: filteredSets };
                })
                .filter(item => item.sets.length > 0);

            if (logsToSave.length === 0) { alert('저장할 유효한 세트가 없습니다.'); return; }

            const savedAt = new Date(`${targetDate}T12:00:00`).toISOString();
            const payload = logsToSave.map(item => ({
                user_id: user.id,
                exercise: item.name || item.exercise,
                part: item.body_part,
                type: isCardio(item) ? 'cardio' : 'strength',
                sets_data: item.sets,
                created_at: savedAt,
            }));

            await saveWorkoutLogs(payload);

            localStorage.removeItem(storageKey);
            setPlanList([]);
            alert('저장 완료! 오늘도 수고하셨습니다.');
            setSearchParams({ tab: '달력' });
        } catch (e) {
            console.error('[save workout] error:', e);
            alert('저장 실패: ' + (e?.message || JSON.stringify(e)));
        } finally {
            setIsSaving(false);
        }
    };

    const openPreview = (id, name) => {
        const url = getExerciseGif(null, id);
        if (url) setModalState({ isOpen: true, gifUrl: url, name });
    };

    const inputCls = "w-full bg-white/5 border border-white/10 rounded-md px-1.5 py-1 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors";

    return (
        <div className={`${isMobile ? 'p-4' : 'p-8 max-w-6xl mx-auto'} bg-slate-950 min-h-screen pb-24`}>
            <h2 className="text-3xl font-black italic text-white uppercase underline decoration-indigo-500 decoration-4 underline-offset-8 mb-1">루틴 구성</h2>
            {!isToday && (
                <p className="text-blue-400 font-bold text-sm mb-8">{new Date(targetDate + 'T12:00:00').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })} 기록</p>
            )}
            {isToday && <div className="mb-8" />}
            <div className="grid lg:grid-cols-2 gap-10">
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                    <ExerciseSelector
                        selection={selection}
                        setSelection={setSelection}
                    />
                    {selection.exercise && <button onClick={handleAddToList} className="w-full mt-6 py-4 bg-indigo-600 text-white font-black rounded-xl italic active:scale-95 transition-all">리스트에 추가하기</button>}
                </div>
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 min-h-[400px]">
                    <h3 className="text-xl font-bold text-white mb-6">오늘의 운동 리스트 ({planList.length})</h3>
                    <div className="space-y-4">
                        {planList.map((item, exIdx) => {
                            const cardio = isCardio(item);
                            const sets = item.sets || [];
                            const pr = personalRecords[item.name || item.exercise];
                            return (
                                <div key={item.id} className={`p-4 border rounded-2xl space-y-3 transition-all ${item.completed ? 'bg-slate-800/30 border-green-500/30 opacity-70' : 'bg-slate-800/60 border-slate-700'}`}>
                                    {/* 운동 헤더 */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-900">
                                            <GifRenderer exerciseId={item.id} onClick={() => openPreview(item.id, item.name)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-indigo-400 uppercase">{PART_MAP[item.body_part]}</p>
                                            <h4 className={`font-bold text-white uppercase truncate ${isMobile ? 'text-base' : 'text-sm'}`}>{item.name || item.exercise}</h4>
                                            {pr && (
                                                <p className="text-xs text-green-400 font-bold mt-0.5">
                                                    🏆 최고: {pr.kg}kg × {pr.reps}회
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => toggleCompleted(exIdx)}
                                            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border transition-all active:scale-95 shrink-0 ${item.completed ? 'bg-green-500/20 text-green-400 border-green-500' : 'bg-transparent text-blue-400 border-blue-500'}`}
                                        >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                                            {item.completed ? 'DONE' : '완료'}
                                        </button>
                                        <button onClick={() => setPlanList(prev => prev.filter(p => p.id !== item.id))} className="p-2 text-slate-500 hover:text-white shrink-0 transition-colors">×</button>
                                    </div>

                                    {/* 세트 입력 */}
                                    <div className="space-y-2 pl-1">
                                        {sets.length === 0 ? (
                                            <button onClick={() => addSet(exIdx)} className="w-full py-2 text-xs text-indigo-400 border border-dashed border-indigo-800/60 rounded-xl hover:border-indigo-600 transition-all">
                                                + 세트 추가
                                            </button>
                                        ) : sets.map((set, setIdx) => {
                                            const isLast = setIdx === sets.length - 1;
                                            return (
                                                <div key={setIdx} style={{display:'grid', gridTemplateColumns:'16px 1fr 56px 40px 28px', gap:'6px', alignItems:'center'}}>
                                                    {/* 세트번호 */}
                                                    <span className="text-gray-500 text-xs text-center">{setIdx + 1}</span>

                                                    {/* kg 영역 (1fr) */}
                                                    {cardio ? (
                                                        <div className="relative">
                                                            <input type="number" inputMode="decimal" value={set.level} onChange={e => updateSet(exIdx, setIdx, 'level', e.target.value)} className={`${inputCls} pr-6`} placeholder="0" />
                                                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">Lv</span>
                                                        </div>
                                                    ) : set.isDropSet ? (
                                                        <div className="grid grid-cols-3 gap-1">
                                                            {[0, 1, 2].map(di => (
                                                                <input key={di} type="number" inputMode="decimal" value={set.dropKgs[di]} onChange={e => { const d = [...set.dropKgs]; d[di] = e.target.value; updateSet(exIdx, setIdx, 'dropKgs', d); }} className={inputCls} placeholder="-" />
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <input type="number" inputMode="decimal" value={set.kg} onChange={e => updateSet(exIdx, setIdx, 'kg', e.target.value)} className={`${inputCls} pr-6`} placeholder="0" />
                                                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">kg</span>
                                                        </div>
                                                    )}

                                                    {/* reps 영역 (56px) */}
                                                    {cardio ? (
                                                        <div className="relative">
                                                            <input type="number" inputMode="numeric" value={set.minutes} onChange={e => updateSet(exIdx, setIdx, 'minutes', e.target.value)} className={`${inputCls} pr-5`} placeholder="0" />
                                                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">분</span>
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <input type="number" inputMode="numeric" value={set.reps} onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value)} className={`${inputCls} pr-7`} placeholder="0" />
                                                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">reps</span>
                                                        </div>
                                                    )}

                                                    {/* 드롭 체크박스 (40px) */}
                                                    {cardio ? (
                                                        <div />
                                                    ) : (
                                                        <label className="flex items-center gap-0.5 justify-center cursor-pointer">
                                                            <input type="checkbox" checked={!!set.isDropSet} onChange={() => toggleDropSet(exIdx, setIdx)} className="w-3 h-3 accent-red-500" />
                                                            <span className="text-xs text-gray-400">드롭</span>
                                                        </label>
                                                    )}

                                                    {/* + / × 버튼 (28px) */}
                                                    {isLast ? (
                                                        <button onClick={() => addSet(exIdx)} className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-500 active:scale-90 text-white flex items-center justify-center text-base leading-none transition-all">+</button>
                                                    ) : (
                                                        <button onClick={() => removeSet(exIdx, setIdx)} className="w-7 h-7 rounded-full flex items-center justify-center text-gray-500 hover:text-red-400 transition-colors">
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {planList.length > 0 && (
                        <button
                            onClick={handleSaveWorkout}
                            disabled={isSaving}
                            className={`w-full mt-4 py-4 rounded-xl font-bold text-base transition-all active:scale-[0.98] flex items-center justify-center gap-2
                                ${isSaving ? 'bg-blue-600 opacity-70 cursor-not-allowed text-white' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'}`}
                        >
                            {isSaving ? (
                                <span>저장 중...</span>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                                    오늘 운동 완료
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
            <GifModal isOpen={modalState.isOpen} onClose={() => setModalState({ ...modalState, isOpen: false })} gifUrl={modalState.gifUrl} exerciseName={modalState.name} />
        </div>
    );
};

export default WorkoutPlanScreen;
