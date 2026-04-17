import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate, useSearchParams } from 'react-router-dom';
import { Target, Flame, Plus } from 'lucide-react';
import EXERCISE_DATASET from './src/data/exercises.json';

const EQUIPMENT_MAP = {
    'barbell': '바벨',
    'body weight': '맨몸',
    'cable': '케이블',
    'dumbbell': '덤벨',
    'leverage machine': '레버리지 머신',
    'smith machine': '스미스 머신',
    'sled machine': '슬레드 머신',
    'trap bar': '트랩바',
    'ez barbell': 'EZ바',
    'assisted': '어시스트',
    'weighted': '중량',
    'machine': '머신',
    'rope': '로프'
};

import ApiViewer from './src/components/ApiViewer';
import { supabase } from './src/api/supabase';
import OpenAI from 'openai';
import ChatMessage from './src/components/ChatMessage';
import { BODY_PARTS, PART_MAP, STORAGE_KEYS } from './src/constants/exerciseConstants';
import { fetchLastExerciseRecord, saveWorkoutLogs } from './src/api/workoutApi';
import Onboarding from './src/components/Onboarding';

const BottomNav = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: '달력', label: '달력', icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        )},
        { id: '루틴구성', label: '루틴구성', icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        )},
        { id: 'AI코치', label: 'AI코치', icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        )},
        { id: 'analysis', label: '분석', icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        )}
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
            <div className="max-w-2xl mx-auto flex justify-around items-center h-20">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative ${
                                isActive ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {isActive && (
                                <span className="absolute top-0 w-12 h-1 bg-blue-500 rounded-b-full shadow-lg shadow-blue-500/50 animate-fade-in" />
                            )}
                            <div className={`mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
                                {tab.icon}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-tighter transition-all ${
                                isActive ? 'opacity-100 translate-y-0' : 'opacity-80'
                            }`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

// OpenAI 인스턴스 생성
const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
});

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

/**
 * [Full-screen GIF Modal]
 */
const GifModal = ({ isOpen, onClose, gifUrl, exerciseName }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={onClose}></div>
            <div className="relative w-full max-w-2xl bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 animate-scale-up">
                <div className="absolute top-6 right-6 z-10">
                    <button 
                        onClick={onClose}
                        className="p-3 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition-all active:scale-90 border border-white/10"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="aspect-square w-full bg-slate-950 flex items-center justify-center p-8">
                    {gifUrl ? (
                        <img 
                            src={gifUrl} 
                            alt={exerciseName} 
                            className="w-full h-full object-contain rounded-2xl shadow-2xl"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-slate-700">
                            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span className="font-black italic uppercase tracking-widest text-xs">No Preview Available</span>
                        </div>
                    )}
                </div>
                
                <div className="p-8 bg-gradient-to-t from-slate-950 to-slate-900 border-t border-white/5">
                    <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter text-center">
                        {exerciseName}
                    </h3>
                </div>
            </div>
        </div>
    );
};

const GifRenderer = ({ nameEn, exerciseId, className = "w-full h-full object-cover", onClick }) => {
    const gifUrl = getExerciseGif(nameEn, exerciseId);
    
    if (!gifUrl) {
        return (
            <div className={`bg-slate-800 flex flex-col items-center justify-center gap-1 ${className}`} onClick={onClick}>
                <svg className="w-8 h-8 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
        );
    }
    
    return (
        <img 
            src={gifUrl} 
            alt="Exercise Preview" 
            className={`${className} cursor-pointer hover:scale-110 transition-transform duration-500`}
            loading="lazy"
            onClick={onClick}
        />
    );
};

/**
 * [Common: User Profile Modal]
 */
const UserProfileModal = ({ isOpen, onClose, userData, onUpdate }) => {
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
        visceral_fat_level: userData?.visceral_fat_level || ''
    });

    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        const { error } = await supabase.auth.updateUser({
            data: { ...profile }
        });
        setIsSaving(false);
        if (error) {
            alert('저장 실패: ' + error.message);
        } else {
            localStorage.setItem(STORAGE_KEYS.USER_BODY_INFO, JSON.stringify(profile));
            alert('저장되었습니다.');
            onUpdate();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-slate-900 border border-white/10 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-white italic">내 정보 설정</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>
                
                <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">나이</label>
                            <input type="number" value={profile.age} onChange={e => setProfile({...profile, age: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="세" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">성별</label>
                            <select value={profile.gender} onChange={e => setProfile({...profile, gender: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none">
                                <option value="">선택</option>
                                <option value="male">남성</option>
                                <option value="female">여성</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">키 (cm)</label>
                            <input type="number" value={profile.height} onChange={e => setProfile({...profile, height: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="cm" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">몸무게 (kg)</label>
                            <input type="number" value={profile.weight} onChange={e => setProfile({...profile, weight: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" placeholder="kg" />
                        </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800">
                        <label className="text-xs font-black text-blue-400 uppercase block mb-4">인바디 정보</label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">골격근량 (kg)</label>
                                <input type="number" value={profile.skeletal_muscle_mass} onChange={e => setProfile({...profile, skeletal_muscle_mass: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">체지방량 (kg)</label>
                                <input type="number" value={profile.body_fat_mass} onChange={e => setProfile({...profile, body_fat_mass: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">체지방률 (%)</label>
                                <input type="number" value={profile.body_fat_percentage} onChange={e => setProfile({...profile, body_fat_percentage: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">기초대사량 (kcal)</label>
                                <input type="number" value={profile.bmr} onChange={e => setProfile({...profile, bmr: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">내장지방레벨</label>
                                <input type="number" value={profile.visceral_fat_level} onChange={e => setProfile({...profile, visceral_fat_level: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex gap-3">
                        <button onClick={onClose} className="flex-1 py-4 bg-slate-800 text-white font-bold rounded-xl transition-all hover:bg-slate-700">취소</button>
                        <button onClick={handleSave} disabled={isSaving} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:bg-blue-500 disabled:opacity-50">{isSaving ? '저장 중...' : '저장하기'}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * [Common: Exercise Selector - Refactored for exercises.json]
 */
const ExerciseSelector = ({ selection, setSelection, onExerciseSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [modalState, setModalState] = useState({ isOpen: false, gifUrl: '', name: '', isDirectInput: false });
    const [customName, setCustomName] = useState('');

    const handlePartClick = (p) => {
        setSelection({ ...selection, part: p, equipment: null, exercise: null, manualName: '' });
        setSearchTerm('');
    };

    const handleEquipmentClick = (eq) => {
        setSelection({ ...selection, equipment: eq, exercise: null, manualName: '' });
        setSearchTerm('');
    };

    const handleExerciseClick = (ex) => {
        setSelection({ 
            ...selection, 
            exercise: ex,
            manualName: ''
        });
        if (onExerciseSelect) onExerciseSelect(ex.name);
    };

    const handlePreviewOpen = (e, ex) => {
        e.stopPropagation(); // 부모의 onClick(handleExerciseClick) 방지
        const url = getExerciseGif(null, ex.id);
        setModalState({ isOpen: true, gifUrl: url, name: ex.name, isDirectInput: false });
    };

    const handleDirectInputOpen = () => {
        setCustomName('');
        setModalState({ isOpen: true, gifUrl: '', name: '운동 직접 입력', isDirectInput: true });
    };

    const handleDirectInputSave = () => {
        if (!customName.trim()) return;
        const customEx = {
            id: `custom-${Date.now()}`,
            name: customName.trim(),
            equipment: selection.equipment || '기타',
            bodyPart: selection.part
        };
        handleExerciseClick(customEx);
        setModalState({ ...modalState, isOpen: false });
    };

    const handleBack = () => {
        if (selection.exercise) {
            setSelection({ ...selection, exercise: null });
        } else if (selection.equipment) {
            setSelection({ ...selection, equipment: null });
        } else if (selection.part) {
            setSelection({ ...selection, part: null });
        }
    };

    const availableEquipments = useMemo(() => {
        if (!selection.part) return [];
        const equipments = EXERCISE_DATASET
            .filter(ex => ex.bodyPart === selection.part)
            .map(ex => ex.equipment);
        return [...new Set(equipments)];
    }, [selection.part]);

    const filteredExercises = useMemo(() => {
        if (!selection.part || !selection.equipment) return [];
        let list = EXERCISE_DATASET.filter(ex => 
            ex.bodyPart === selection.part && 
            ex.equipment === selection.equipment
        );
        if (searchTerm.trim()) {
            list = list.filter(ex => {
                const searchLower = searchTerm.toLowerCase();
                const nameEn = ex.nameEn?.toLowerCase() || '';
                const nameKo = ex.name.toLowerCase();
                return nameEn.includes(searchLower) || nameKo.includes(searchLower);
            });
        }
        return list;
    }, [selection.part, selection.equipment, searchTerm]);

    return (
        <div className="space-y-8">
            {/* Selection Summary & Back Button */}
            <div className="flex items-center gap-3">
                {(selection.part || selection.equipment || selection.exercise) && (
                    <button 
                        onClick={handleBack}
                        className="p-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                )}
                {(selection.part || selection.equipment || selection.exercise) && (
                    <div className="flex-1 p-4 bg-blue-600/10 border border-blue-500/20 rounded-2xl animate-fade-in">
                        <div className="flex flex-wrap items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-widest">
                            {selection.part && <span>{BODY_PARTS.find(p => p.key === selection.part)?.label}</span>}
                            {selection.equipment && (
                                <>
                                    <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                                    <span className="text-slate-300">{EQUIPMENT_MAP[selection.equipment] || selection.equipment}</span>
                                </>
                            )}
                            {selection.exercise && (
                                <>
                                    <svg className="w-3 h-3 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"/></svg>
                                    <span className="text-white uppercase">{selection.exercise.name}</span>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Step 1: Body Part */}
            {!selection.part && (
                <div className="animate-fade-in">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block px-1">Step 1. 부위 선택</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {BODY_PARTS.map(p => (
                            <button 
                                key={p.key} 
                                onClick={() => handlePartClick(p.key)} 
                                className={`py-3 rounded-2xl font-black text-[10px] sm:text-xs tracking-tighter transition-all duration-300 bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/50`}
                            >
                                {p.label.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Equipment */}
            {selection.part && !selection.equipment && (
                <div className="animate-fade-in">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 block px-1">Step 2. 기구 선택</label>
                    <div className="grid grid-cols-2 gap-2">
                        {availableEquipments.map(eq => (
                            <button 
                                key={eq} 
                                onClick={() => handleEquipmentClick(eq)} 
                                className={`py-3 rounded-2xl font-black text-[10px] sm:text-xs tracking-tighter transition-all duration-300 bg-slate-800/50 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/50`}
                            >
                                {(EQUIPMENT_MAP[eq] || eq).toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Search and List */}
            {selection.part && selection.equipment && (
                <div className="animate-fade-in space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block px-1">Step 3. 운동 선택</label>
                    <div className="relative">
                        <input 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="운동 명칭 검색 (한글/English)..."
                            className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                        <svg className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredExercises.length === 0 ? (
                            <p className="text-center py-10 text-slate-500 italic text-xs">검색 결과가 없습니다.</p>
                        ) : (
                            <>
                                {filteredExercises.map((ex) => (
                                    <div 
                                        key={ex.id}
                                        onClick={() => handleExerciseClick(ex)}
                                        className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${selection.exercise?.id === ex.id ? 'bg-blue-600/20 border-blue-500' : 'bg-slate-800/30 border-white/5 hover:border-slate-600'}`}
                                    >
                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-white/5 shadow-inner">
                                            <GifRenderer 
                                                exerciseId={ex.id} 
                                                onClick={(e) => handlePreviewOpen(e, ex)}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-black italic uppercase truncate ${selection.exercise?.id === ex.id ? 'text-blue-400' : 'text-white'}`}>{ex.name}</p>
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{EQUIPMENT_MAP[ex.equipment] || ex.equipment}</span>
                                        </div>
                                        <div className="shrink-0">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleExerciseClick(ex); }}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${selection.exercise?.id === ex.id ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-500 hover:text-white'}`}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                
                                {/* 직접 입력 옵션 */}
                                <div 
                                    onClick={handleDirectInputOpen}
                                    className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border bg-slate-800/10 border-dashed border-slate-700 hover:border-slate-500 mt-4 group"
                                >
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-slate-900 shrink-0 border border-white/5">
                                        <svg className="w-5 h-5 text-slate-600 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-black italic text-slate-400 group-hover:text-white uppercase tracking-tighter">찾는 운동이 없나요?</p>
                                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">직접 입력하여 추가하기</p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {modalState.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-fade-in">
                    <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={() => setModalState({ ...modalState, isOpen: false })}></div>
                    <div className="relative w-full max-w-2xl bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 animate-scale-up">
                        <div className="absolute top-6 right-6 z-10">
                            <button 
                                onClick={() => setModalState({ ...modalState, isOpen: false })}
                                className="p-3 bg-slate-800/80 hover:bg-slate-700 text-white rounded-full transition-all active:scale-90 border border-white/10"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        
                        {modalState.isDirectInput ? (
                            <div className="p-10 pt-16 flex flex-col gap-8">
                                <div className="space-y-2">
                                    <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter">운동 직접 입력</h3>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">나만의 커스텀 운동을 루틴에 추가하세요.</p>
                                </div>
                                <div className="space-y-4">
                                    <input 
                                        autoFocus
                                        type="text"
                                        value={customName}
                                        onChange={(e) => setCustomName(e.target.value)}
                                        placeholder="운동 이름을 입력하세요 (예: 힌두 푸쉬업)"
                                        className="w-full bg-slate-950 border border-white/10 rounded-2xl py-5 px-6 text-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold placeholder:text-slate-800"
                                    />
                                    <button 
                                        onClick={handleDirectInputSave}
                                        className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl italic text-lg transition-all active:scale-[0.98] shadow-xl shadow-blue-900/20"
                                    >
                                        루틴에 추가하기
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className="aspect-square w-full bg-slate-950 flex items-center justify-center p-8">
                                    {modalState.gifUrl ? (
                                        <img 
                                            src={modalState.gifUrl} 
                                            alt={modalState.name} 
                                            className="w-full h-full object-contain rounded-2xl shadow-2xl"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center gap-4 text-slate-700">
                                            <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            <span className="font-black italic uppercase tracking-widest text-xs">No Preview Available</span>
                                        </div>
                                    )}
                                </div>
                                <div className="p-8 bg-gradient-to-t from-slate-950 to-slate-900 border-t border-white/5">
                                    <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter text-center">
                                        {modalState.name}
                                    </h3>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const BackButton = () => {
    const navigate = useNavigate();
    return (
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            <span className="font-medium">돌아가기</span>
        </button>
    );
};

/**
 * [Screen: Login]
 */
const LoginScreen = () => {
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            alert('이메일과 비밀번호를 입력해주세요.');
            return;
        }
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setIsLoading(false);
        if (error) alert('로그인 실패: ' + error.message);
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({ 
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) alert('구글 로그인 실패: ' + error.message);
    };

    const handleSignupComplete = async () => {
        if (!email || !password) { alert('이메일과 비밀번호는 필수입니다.'); return; }
        if (password !== passwordConfirm) { alert('비밀번호가 일치하지 않습니다.'); return; }
        
        setIsLoading(true);
        const { data, error } = await supabase.auth.signUp({ email, password });
        setIsLoading(false);

        if (error) {
            alert('회원가입 실패: ' + error.message);
        } else {
            alert('가입하신 이메일로 인증 메일이 발송되었습니다!');
            setIsSignup(false);
        }
    };

    if (isSignup) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 animate-fade-in bg-slate-950">
                <div className="w-full max-sm space-y-8">
                    <button onClick={() => setIsSignup(false)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 group">
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        <span className="font-medium">돌아가기</span>
                    </button>
                    <div className="text-center">
                        <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">회원가입</h2>
                    </div>
                    <div className="space-y-4 bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
                        <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                        <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                        <input type="password" placeholder="비밀번호 확인" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                        <button onClick={handleSignupComplete} disabled={isLoading} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl active:scale-95 transition-all">가입 완료</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-slate-950">
            <div className="mb-12 text-center">
                <h1 className="text-6xl font-extrabold italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">MyGym</h1>
                <p className="mt-2 text-gray-400 font-medium tracking-wide uppercase italic">Level up your limits</p>
            </div>
            <div className="w-full max-sm space-y-4">
                <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                <div className="flex gap-3">
                    <button onClick={handleLogin} disabled={isLoading} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl active:scale-95 transition-all">로그인</button>
                    <button onClick={() => setIsSignup(true)} className="flex-1 py-4 bg-slate-700 text-white font-bold rounded-xl active:scale-95 transition-all">회원가입</button>
                </div>
                <button onClick={handleGoogleLogin} className="w-full py-4 bg-white text-slate-900 font-bold rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" /> Google로 시작하기
                </button>
            </div>
        </div>
    );
};

const WorkoutDetailScreen = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const queryDate = searchParams.get('date');
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = async () => {
        if (!queryDate) return;
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data, error } = await supabase.from('workout_logs').select('*').eq('user_id', user.id).gte('created_at', `${queryDate}T00:00:00`).lte('created_at', `${queryDate}T23:59:59`).order('created_at', { ascending: true });
            if (error) throw error;
            setLogs(data || []);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchLogs(); }, [queryDate]);

    const handleDelete = async (id) => {
        if (!confirm('삭제하시겠습니까?')) return;
        const { error } = await supabase.from('workout_logs').delete().eq('id', id);
        if (!error) fetchLogs();
    };

    return (
        <div className="p-4 md:p-12 max-w-4xl mx-auto bg-slate-950 min-h-screen pb-24">
            <BackButton />
            <h2 className="text-3xl font-black italic text-white mb-8">{queryDate} 트레이닝 상세</h2>
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center text-slate-500 italic py-20">로딩 중...</div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center animate-fade-in">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                                <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            </div>
                            <p className="text-slate-500 font-bold text-sm">이 날의 운동 기록이 없습니다.</p>
                        </div>
                        <button
                            onClick={() => navigate('/app?tab=루틴구성')}
                            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl italic text-sm active:scale-95 transition-all shadow-lg shadow-blue-600/20"
                        >
                            + 운동 추가하기
                        </button>
                    </div>
                ) : logs.map(log => (
                    <div key={log.id} className="bg-slate-900/40 border border-white/5 p-6 rounded-[1.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className="bg-blue-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase text-white mb-1 inline-block">{PART_MAP[log.part] || log.part}</span>
                                <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">{log.exercise}</h3>
                            </div>
                            <button onClick={() => handleDelete(log.id)} className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                        <div className="space-y-1">
                            {log.part === 'cardio' ? <div className="text-blue-400 font-black">{log.sets_data[0]?.duration}</div> : log.sets_data.map((s, idx) => (
                                <div key={idx} className="flex justify-between py-1 px-3 bg-slate-950/50 rounded-lg text-xs font-bold">
                                    <span className="text-slate-500">{idx + 1} SET</span>
                                    <span className="text-white">{s.weight}kg x {s.reps}회</span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const WorkoutPlanScreen = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const dateParam = searchParams.get('date');
    const targetDate = dateParam || new Date().toISOString().split('T')[0];
    const storageKey = `mygym_routine_${targetDate}`;
    const isToday = targetDate === new Date().toISOString().split('T')[0];

    const [selection, setSelection] = useState({ part: '', exercise: null, manualName: '' });
    const [planList, setPlanList] = useState(() => JSON.parse(localStorage.getItem(storageKey) || '[]'));
    const [modalState, setModalState] = useState({ isOpen: false, gifUrl: '', name: '' });
    const [isSaving, setIsSaving] = useState(false);

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
        <div className="p-6 md:p-12 max-w-6xl mx-auto bg-slate-950 min-h-screen pb-24">
            <h2 className="text-3xl font-black italic text-white uppercase underline decoration-indigo-500 decoration-4 underline-offset-8 mb-1">루틴 구성</h2>
            {!isToday && (
                <p className="text-blue-400 font-bold text-sm mb-8">{new Date(targetDate + 'T12:00:00').toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' })} 기록</p>
            )}
            {isToday && <div className="mb-8" />}
            <div className="grid lg:grid-cols-2 gap-10">
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                    <ExerciseSelector selection={selection} setSelection={setSelection} />
                    {selection.exercise && <button onClick={handleAddToList} className="w-full mt-6 py-4 bg-indigo-600 text-white font-black rounded-xl italic active:scale-95 transition-all">리스트에 추가하기</button>}
                </div>
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 min-h-[400px]">
                    <h3 className="text-xl font-bold text-white mb-6">오늘의 운동 리스트 ({planList.length})</h3>
                    <div className="space-y-4">
                        {planList.map((item, exIdx) => {
                            const cardio = isCardio(item);
                            const sets = item.sets || [];
                            return (
                                <div key={item.id} className={`p-4 border rounded-2xl space-y-3 transition-all ${item.completed ? 'bg-slate-800/30 border-green-500/30 opacity-70' : 'bg-slate-800/60 border-slate-700'}`}>
                                    {/* 운동 헤더 */}
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-slate-900">
                                            <GifRenderer exerciseId={item.id} onClick={() => openPreview(item.id, item.name)} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase">{PART_MAP[item.body_part]}</p>
                                            <h4 className="text-sm font-bold text-white uppercase truncate">{item.name || item.exercise}</h4>
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
                                                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 pointer-events-none">Lv</span>
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
                                                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 pointer-events-none">kg</span>
                                                        </div>
                                                    )}

                                                    {/* reps 영역 (56px) */}
                                                    {cardio ? (
                                                        <div className="relative">
                                                            <input type="number" inputMode="numeric" value={set.minutes} onChange={e => updateSet(exIdx, setIdx, 'minutes', e.target.value)} className={`${inputCls} pr-5`} placeholder="0" />
                                                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 pointer-events-none">분</span>
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <input type="number" inputMode="numeric" value={set.reps} onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value)} className={`${inputCls} pr-7`} placeholder="0" />
                                                            <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 pointer-events-none">reps</span>
                                                        </div>
                                                    )}

                                                    {/* 드롭 체크박스 (40px) */}
                                                    {cardio ? (
                                                        <div />
                                                    ) : (
                                                        <label className="flex items-center gap-0.5 justify-center cursor-pointer">
                                                            <input type="checkbox" checked={!!set.isDropSet} onChange={() => toggleDropSet(exIdx, setIdx)} className="w-3 h-3 accent-red-500" />
                                                            <span className="text-[10px] text-gray-400">드롭</span>
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

const AIRecommendationScreen = () => {
    const [profile, setProfile] = useState(null);
    const [recentStats, setRecentStats] = useState({ totalWorkouts: 0, mostFrequentPart: null });
    const [greeting, setGreeting] = useState('');
    const [messages, setMessages] = useState(() => JSON.parse(localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY) || '[]'));
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const getMostFrequent = (arr) => {
        if (!arr || arr.length === 0) return null;
        const counts = {};
        arr.forEach(item => { if (item) counts[item] = (counts[item] || 0) + 1; });
        const keys = Object.keys(counts);
        if (keys.length === 0) return null;
        return keys.reduce((a, b) => counts[a] > counts[b] ? a : b);
    };

    const generateGreeting = (profile, stats) => {
        if (!profile) return "안녕하세요! MyGym AI 코치입니다. 프로필을 설정하시면 더 개인화된 코칭을 받으실 수 있어요. 오늘은 어떤 운동을 하실까요?";

        const { experience_level, goal, weekly_frequency, limitations } = profile;
        const { totalWorkouts, mostFrequentPart } = stats;

        let greeting = "안녕하세요! ";

        if (experience_level === 'beginner') greeting += "웨이트트레이닝 경험이 많이 없으셔서 걱정되시겠지만, 저만 믿고 따라와 주세요! ";
        else if (experience_level === 'intermediate') greeting += "꾸준히 운동하고 계시는 걸 알고 있어요. 한 단계 더 성장할 준비가 되셨네요! ";
        else greeting += "탄탄한 운동 경력을 가지고 계시네요. 더 강해질 준비 되셨죠? ";

        if (goal === 'strength') greeting += "강력한 근력을 만들기 위해 ";
        else if (goal === 'hypertrophy') greeting += "멋진 근육을 키우기 위해 ";
        else if (goal === 'weight_loss') greeting += "건강한 체중 감량을 위해 ";
        else greeting += "건강한 생활을 위해 ";

        greeting += `주 ${weekly_frequency}회 함께 달려볼게요. `;

        if (limitations && limitations.length > 0) {
            greeting += `${limitations.join(', ')} 부위 부상을 고려해서 안전한 운동으로 구성할게요. `;
        }

        if (totalWorkouts > 0) {
            greeting += `\n지난 7일간 ${totalWorkouts}회 운동하셨네요! `;
            if (mostFrequentPart) greeting += `${mostFrequentPart} 위주로 하셨는데, 오늘은 어떤 부위를 공략해볼까요?`;
        } else {
            greeting += "\n오늘부터 다시 활기차게 시작해볼까요? 어떤 운동이 필요하신가요?";
        }

        return greeting;
    };

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return;

                // 1. 프로필 조회
                const { data: profileData } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .maybeSingle();
                setProfile(profileData);

                // 2. 최근 7일 운동 기록 조회
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const { data: logs } = await supabase
                    .from('workout_logs')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .gte('created_at', sevenDaysAgo.toISOString());

                const stats = {
                    totalWorkouts: new Set(logs?.map(l => l.created_at.split('T')[0])).size || 0,
                    mostFrequentPart: getMostFrequent(logs?.map(l => l.part))
                };
                setRecentStats(stats);

                // 3. 인사말 생성
                const greetingText = generateGreeting(profileData, stats);
                setGreeting(greetingText);

                // 4. 채팅 내역이 비어있으면 인사말 추가
                if (messages.length === 0) {
                    setMessages([{ id: Date.now(), type: 'ai', text: greetingText }]);
                }
            } catch (e) {
                console.error('Error loading AI Coach data:', e);
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => { localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(messages)); }, [messages]);

    const handleSendMessage = async (text = inputText) => {
        if (!text.trim() || isTyping) return;
        
        const userMsg = { id: Date.now(), type: 'user', text };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);

        const EXERCISE_MENU = EXERCISE_DATASET.map(ex => `${ex.name} (${ex.nameEn})`).join(', ');
        const systemRole = `너는 MyGym의 전문 PT 코치야. 
        [사용자 프로필]
        - 목표: ${profile?.goal || '건강 관리'}
        - 경험: ${profile?.experience_level || '초보'}
        - 주당 횟수: ${profile?.weekly_frequency || 3}회
        - 기구: ${profile?.equipment_access || '헬스장'}
        - 제한사항: ${profile?.limitations?.join(', ') || '없음'}
        - 신체: ${profile?.height || '--'}cm, ${profile?.weight || '--'}kg
        
        [최근 7일 기록]
        - 운동 횟수: ${recentStats.totalWorkouts}회
        - 집중 부위: ${recentStats.mostFrequentPart || '없음'}

        [중요 규칙]
        1. 사용자 프로필과 최근 기록을 분석해 개인화된 답변을 제공하라.
        2. 루틴 추천 시 반드시 답변 끝에 [ROUTINE_DATA: JSON] 형식으로 포함하라.
        3. 'nameEn'은 아래 [공식 리스트]의 이름을 정확히 사용하라.
        4. 루틴 항목: { "name": "한국어명", "nameEn": "english name", "part": "부위", "sets": 4, "reps": 12, "weight": 0 }
        
        [공식 리스트]
        ${EXERCISE_MENU}`;

        try {
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemRole },
                    ...messages.slice(-6).map(m => ({ role: m.type === 'ai' ? 'assistant' : 'user', content: m.text })),
                    { role: 'user', content: text }
                ],
                temperature: 0.7
            });
            const aiText = response.choices[0].message.content;
            setMessages(prev => [...prev, { id: Date.now() + 1, type: 'ai', text: aiText }]);
        } catch (e) {
            console.error(e);
            alert('AI 코치와 연결이 원활하지 않습니다.');
        } finally {
            setIsTyping(false);
        }
    };

    const sendRecommendationRequest = async (mode) => {
        if (!profile) {
            alert("프로필 정보를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.");
            return;
        }
        let requestText = '';
        if (mode === 'balanced') {
            requestText = "나의 프로필과 최근 기록을 바탕으로 오늘 할 균형잡힌 운동 루틴을 추천해줘. 부족한 부위가 있으면 보완해주고 점진적 과부하 원칙을 적용해줘.";
        } else if (mode === 'hard') {
            requestText = "나의 프로필을 바탕으로 강도 높은 하드모드 루틴을 추천해줘. 평소보다 운동 개수를 늘리고 도전적인 무게를 제시해줘.";
        }
        handleSendMessage(requestText);
    };

    const handleAddRoutineBatch = (items) => {
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `mygym_routine_${today}`;
        const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
        
        const newItems = items.map(item => {
            const ex = EXERCISE_DATASET.find(e => e.nameEn?.toLowerCase() === item.nameEn?.toLowerCase() || e.name === item.name);
            return {
                id: Date.now() + Math.random(),
                name: item.name,
                exercise: item.name,
                exercise_id: ex?.id,
                body_part: item.part,
                sets: Array(item.sets || 4).fill(0).map(() => ({
                    kg: item.weight || 0,
                    reps: item.reps || 12,
                    isDropSet: item.isDropSet || false
                })),
                completed: false
            };
        });

        const filteredNewItems = newItems.filter(newItem => !saved.some(s => s.name === newItem.name));
        if (filteredNewItems.length === 0 && newItems.length > 0) {
            alert('이미 루틴에 모두 추가되어 있습니다.');
            return;
        }

        localStorage.setItem(storageKey, JSON.stringify([...saved, ...filteredNewItems]));
        alert(`${filteredNewItems.length}개의 운동이 오늘 루틴에 추가되었습니다!`);
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950 max-w-2xl mx-auto border-x border-white/5 pb-20 relative">
            <div className="p-4 border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <h2 className="text-sm font-black text-white italic uppercase tracking-tighter">AI PT COACH</h2>
                </div>
                <button onClick={() => { if(confirm('대화 내역을 초기화할까요?')) { setMessages([{ id: Date.now(), type: 'ai', text: greeting }]); localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY); } }} className="text-[9px] font-bold text-slate-500 uppercase hover:text-slate-300">초기화</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar pb-32">
                {messages.map(msg => <ChatMessage key={msg.id} msg={msg} onAddRoutineItem={handleAddRoutineBatch} />)}
                {isTyping && <div className="text-slate-500 italic text-xs animate-pulse ml-2">코치가 당신의 데이터를 분석 중...</div>}
            </div>

            <div className="absolute bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent space-y-4">
                <div className="flex gap-3">
                    <button
                        onClick={() => sendRecommendationRequest('balanced')}
                        className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black italic text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-blue-600/20"
                    >
                        <Target size={16} /> 오늘의 루틴 추천
                    </button>
                    <button
                        onClick={() => sendRecommendationRequest('hard')}
                        className="flex-1 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black italic text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg shadow-rose-600/20"
                    >
                        <Flame size={16} /> 하드모드
                    </button>
                </div>
                
                <div className="relative">
                    <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} placeholder="코치에게 질문하기 (예: 어깨 넓어지는 루틴 짜줘)" className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-5 pr-14 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-600" />
                    <button onClick={() => handleSendMessage()} className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white rounded-xl font-bold active:scale-90 transition-transform">↑</button>
                </div>
            </div>
        </div>
    );
};

const DayDetailView = ({ date, onBack, onGoToRoutine }) => {
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data, error } = await supabase.from('workout_logs').select('*').eq('user_id', user.id).gte('created_at', `${date}T00:00:00`).lte('created_at', `${date}T23:59:59`).order('created_at', { ascending: true });
            if (error) throw error;
            setLogs(data || []);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchLogs(); }, [date]);

    const handleDelete = async (id) => {
        if (!confirm('삭제하시겠습니까?')) return;
        const { error } = await supabase.from('workout_logs').delete().eq('id', id);
        if (!error) fetchLogs();
    };

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group">
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                <span className="font-bold">달력으로</span>
            </button>
            <h2 className="text-2xl font-black italic text-white mb-6">{date} 트레이닝</h2>
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center text-slate-500 italic py-20">로딩 중...</div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                                <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            </div>
                            <p className="text-slate-500 font-bold text-sm">이 날의 운동 기록이 없습니다.</p>
                        </div>
                        <button onClick={onGoToRoutine} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl italic text-sm active:scale-95 transition-all shadow-lg shadow-blue-600/20">
                            + 운동 추가하기
                        </button>
                    </div>
                ) : (
                    <>
                        {logs.map(log => (
                            <div key={log.id} className="bg-slate-900/40 border border-white/5 p-6 rounded-[1.5rem] relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="bg-blue-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase text-white mb-1 inline-block">{PART_MAP[log.part] || log.part}</span>
                                        <h3 className="text-xl font-black italic text-white uppercase tracking-tighter">{log.exercise}</h3>
                                    </div>
                                    <button onClick={() => handleDelete(log.id)} className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                                <div className="space-y-1">
                                    {log.sets_data?.map((s, idx) => (
                                        <div key={idx} className="flex justify-between py-1 px-3 bg-slate-950/50 rounded-lg text-xs font-bold">
                                            <span className="text-slate-500">{idx + 1} SET</span>
                                            <span className="text-white">
                                                {s.isDropSet ? s.dropKgs?.filter(k=>k!=='').join(' › ') + ' kg' : s.kg ? `${s.kg}kg` : ''}{s.reps ? ` × ${s.reps}회` : ''}{s.level ? `Lv ${s.level}` : ''}{s.minutes ? ` ${s.minutes}분` : ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <button onClick={onGoToRoutine} className="w-full py-3 border border-dashed border-blue-600/50 text-blue-400 text-sm font-bold rounded-2xl hover:border-blue-500 transition-all active:scale-[0.98]">
                            + 운동 더 추가하기
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

const CalendarScreen = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [currentViewDate, setCurrentViewDate] = useState(new Date());
    const [workoutGroups, setWorkoutGroups] = useState({});
    const [userData, setUserData] = useState(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(null);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            setUserData(user.user_metadata);
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

    useEffect(() => { fetchLogs(); }, []);

    return (
        <div className="p-4 md:p-12 flex flex-col bg-slate-950 min-h-screen pb-24">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">MY GYM</h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => setIsProfileModalOpen(true)} className="p-2 bg-slate-800 rounded-full">
                        <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/></svg>
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
                />
            ) : (
                <MonthlyCalendar
                    workoutGroups={workoutGroups}
                    currentViewDate={currentViewDate}
                    onMonthChange={(off) => setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + off, 1))}
                    onDayClick={(dateStr) => setSelectedDate(dateStr)}
                />
            )}
            <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} userData={userData} onUpdate={fetchLogs} />
        </div>
    );
};

const MonthlyCalendar = ({ workoutGroups, currentViewDate, onMonthChange, onDayClick }) => {
    const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const year = currentViewDate.getFullYear();
    const month = currentViewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const calendarDays = [...Array(firstDay).fill(null), ...[...Array(lastDate).keys()].map(i => i + 1)];
    const today = new Date();
    const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
    const isFutureMonth = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);

    const achievementRate = useMemo(() => {
        if (isFutureMonth) return null;
        const denominator = isCurrentMonth ? today.getDate() : lastDate;
        const workedDays = Object.keys(workoutGroups).filter(key => {
            const [y, m] = key.split('-').map(Number);
            return y === year && m === month + 1;
        }).length;
        return Math.round((workedDays / denominator) * 100);
    }, [workoutGroups, year, month, isCurrentMonth, isFutureMonth, lastDate]);

    return (
        <div className="bg-slate-800/50 p-6 rounded-[2.5rem] border border-slate-700/50 shadow-2xl">
            <div className="flex justify-between items-center mb-6 px-2">
                <button
                    onClick={() => onMonthChange(-1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-700/50 hover:bg-slate-600 active:scale-90 active:bg-slate-500 transition-all text-white text-xl font-bold"
                >‹</button>
                <h3 className="text-2xl font-black text-white italic">{year}년 {month + 1}월</h3>
                <button
                    onClick={() => onMonthChange(1)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-700/50 hover:bg-slate-600 active:scale-90 active:bg-slate-500 transition-all text-white text-xl font-bold"
                >›</button>
            </div>
            <div className="grid grid-cols-7 gap-1">
                {days.map(d => <div key={d} className="text-center text-[10px] font-black text-slate-500 py-2 uppercase">{d}</div>)}
                {calendarDays.map((d, i) => {
                    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                    const info = d ? workoutGroups[dateStr] : null;
                    const isToday = d && today.getDate() === d && today.getMonth() === month && today.getFullYear() === year;
                    return (
                        <div
                            key={i}
                            onClick={() => d && onDayClick(dateStr)}
                            className={`h-20 flex flex-col items-center justify-center rounded-2xl relative transition-all ${d ? 'cursor-pointer hover:bg-slate-700/50 active:scale-90 active:bg-slate-600/50' : ''}`}
                        >
                            {d && (() => {
                                const parts = info ? [...new Set(info.logs.map(l => l.part))] : [];
                                const partsLabel = parts.length === 1 ? parts[0] : parts.length === 2 ? `${parts[0]}·${parts[1]}` : parts.length >= 3 ? `${parts[0]} 외 ${parts.length - 1}` : '';
                                return (
                                    <>
                                        <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-blue-500 shadow-lg shadow-blue-500/30' : info ? 'border-2 border-red-400' : ''}`}>
                                            <span className="text-sm font-black text-white">{d}</span>
                                        </div>
                                        {isToday && info && <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-0.5" />}
                                        {partsLabel && <span className="text-[9px] text-gray-400 mt-0.5 text-center leading-tight px-0.5">{partsLabel}</span>}
                                    </>
                                );
                            })()}
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-end mt-4 px-2">
                {achievementRate !== null ? (
                    <span className="text-xs text-gray-400">운동 달성률 <span className="text-white font-black">{achievementRate}%</span></span>
                ) : (
                    <span className="text-xs text-gray-400">운동 달성률 <span className="text-slate-500">-</span></span>
                )}
            </div>
        </div>
    );
};

const AnalysisScreen = () => (
    <div className="p-4 md:p-12 bg-slate-950 min-h-screen pb-24">
        <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-8">분석</h2>
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 mb-2">
                <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            </div>
            <p className="text-white font-black italic text-xl uppercase tracking-tighter">분석 기능 준비 중입니다</p>
            <p className="text-slate-500 font-bold text-sm">곧 운동 통계와 그래프를 볼 수 있어요</p>
        </div>
    </div>
);

const MainAppLayout = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || '달력';
    return (
        <div className="relative min-h-screen bg-slate-950">
            <main>
                {activeTab === '달력' && <CalendarScreen />}
                {activeTab === '루틴구성' && <WorkoutPlanScreen />}
                {activeTab === 'AI코치' && <AIRecommendationScreen />}
                {activeTab === 'analysis' && <AnalysisScreen />}
            </main>
            <BottomNav activeTab={activeTab} onTabChange={(tab) => setSearchParams({ tab })} />
        </div>
    );
};


const AppContent = () => {
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle();
            
            if (error) throw error;
            setProfile(data);
        } catch (e) {
            console.error('Error fetching profile:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session) fetchProfile(session.user.id);
            else setIsLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setSession(session);
            if (session) fetchProfile(session.user.id);
            else {
                setProfile(null);
                setIsLoading(false);
            }
            
            if (event === 'SIGNED_IN') navigate('/app', { replace: true });
            else if (event === 'SIGNED_OUT') navigate('/', { replace: true });
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    if (isLoading) return <div className="flex items-center justify-center min-h-screen text-white font-black italic animate-pulse">MYGYM LOADING...</div>;
    if (!session) return <LoginScreen />;
    
    // 프로필이 없으면 온보딩 표시
    if (!profile) {
        return <Onboarding onComplete={() => fetchProfile(session.user.id)} />;
    }

    return (
        <Routes>
            <Route path="/" element={<MainAppLayout />} />
            <Route path="/app" element={<MainAppLayout />} />
            <Route path="/routine-detail" element={<WorkoutDetailScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

const App = () => (<BrowserRouter><AppContent /></BrowserRouter>);
const root = createRoot(document.getElementById('root'));
root.render(<App />);
