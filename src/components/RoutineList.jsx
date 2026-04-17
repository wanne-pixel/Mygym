import React, { useState } from 'react';
import EXERCISE_DATASET from '../data/exercises.json';
import { translateToKorean } from '../api/exerciseApi';

// UX를 해치는 비주류 변형 운동(장비 기준) 필터링 (Curation)
const EXCLUDED_EQUIPMENT = [
    'medicine ball', 'exercise ball', 'bosu ball', 'stability ball', 
    'roller', 'band', 'resistance band', 'kettlebell', 'wheel roller'
];

const CURATED_EXERCISES = EXERCISE_DATASET
    .filter(ex => 
        ex.body_part !== 'neck' &&
        !EXCLUDED_EQUIPMENT.includes(ex.equipment.toLowerCase())
    )
    .map(ex => {
        let consolidatedPart = ex.body_part;
        if (ex.body_part === 'upper legs' || ex.body_part === 'lower legs') consolidatedPart = 'legs';
        if (ex.body_part === 'upper arms' || ex.body_part === 'lower arms') consolidatedPart = 'arms';
        return { ...ex, body_part: consolidatedPart };
    });

/**
 * [Utility: Perfect GIF Matching]
 */
export const getExerciseGif = (nameEn, exerciseId) => {
    if (!nameEn && !exerciseId) return null;
    
    // 1. ID 매칭
    if (exerciseId) {
        const ex = CURATED_EXERCISES.find(e => e.id === exerciseId);
        if (ex) return `/${ex.gif_url}`;
    }
    
    // 2. 이름 매칭
    if (nameEn) {
        const ex = CURATED_EXERCISES.find(e => e.name.toLowerCase() === nameEn.toLowerCase());
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
                    <img 
                        src={gifUrl} 
                        alt={exerciseName} 
                        className="w-full h-full object-contain rounded-2xl shadow-2xl"
                    />
                </div>
                
                <div className="p-8 bg-gradient-to-t from-slate-950 to-slate-900 border-t border-white/5">
                    <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter text-center">
                        {translateToKorean(exerciseName)}
                    </h3>
                </div>
            </div>
        </div>
    );
};

export const GifRenderer = ({ nameEn, exerciseId, className = "w-full h-full object-cover", onClick }) => {
    const gifUrl = getExerciseGif(nameEn, exerciseId);
    
    if (!gifUrl) {
        return (
            <div className={`bg-slate-800 flex flex-col items-center justify-center gap-1 ${className}`}>
                <svg className="w-4 h-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

const RoutineList = ({ data, onAddItem }) => {
    const [addedItems, setAddedItems] = useState([]);
    const [modalState, setModalState] = useState({ isOpen: false, gifUrl: '', name: '' });

    const handleItemClick = (item, itemIdx) => {
        if (addedItems.includes(itemIdx)) return;
        
        const success = onAddItem(item);
        if (success) {
            setAddedItems(prev => [...prev, itemIdx]);
        }
    };

    const handleApplyAll = () => {
        const success = onAddItem(data);
        if (success) {
            setAddedItems(data.map((_, idx) => idx));
        }
    };

    const openPreview = (nameEn, name) => {
        const url = getExerciseGif(nameEn);
        if (url) {
            setModalState({ isOpen: true, gifUrl: url, name: name });
        }
    };

    return (
        <div className="mt-4 space-y-2 bg-slate-900/50 p-3 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-3 px-1">
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">추천 루틴 리스트</div>
                <button 
                    onClick={handleApplyAll}
                    className="text-[9px] font-black text-white bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded-md transition-all active:scale-95"
                >
                    루틴 전체 적용하기 (덮어쓰기)
                </button>
            </div>
            {data.map((item, itemIdx) => {
                const isAdded = addedItems.includes(itemIdx);
                
                return (
                    <div key={itemIdx} className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-white/5 group transition-all hover:border-indigo-500/30">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5 bg-slate-900 shadow-inner">
                            <GifRenderer 
                                nameEn={item.nameEn} 
                                onClick={() => openPreview(item.nameEn, item.name)} 
                            />
                        </div>
                        
                        <div className="flex-1 min-w-0 flex justify-between items-center">
                            <div className="flex flex-col min-w-0 pr-2">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-white font-black italic uppercase tracking-tighter text-sm truncate">
                                        {translateToKorean(item.name)}
                                    </span>
                                    {item.isDropSet && (
                                        <span className="bg-rose-600 text-white text-[7px] font-black px-1 py-0.5 rounded italic shrink-0">D</span>
                                    )}
                                </div>
                                <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate">
                                    {item.sets}S x {item.reps}R {item.weight > 0 ? `(${item.weight}KG)` : ''}
                                </span>
                            </div>
                            
                            <button 
                                onClick={() => handleItemClick(item, itemIdx)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                                    isAdded 
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                                    : 'bg-slate-700 hover:bg-indigo-600 text-slate-300 hover:text-white active:scale-90 shadow-lg shadow-black/20'
                                }`}
                            >
                                {isAdded ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                )}
                            </button>
                        </div>
                    </div>
                );
            })}

            <GifModal 
                isOpen={modalState.isOpen} 
                onClose={() => setModalState({ ...modalState, isOpen: false })} 
                gifUrl={modalState.gifUrl} 
                exerciseName={modalState.name} 
            />
        </div>
    );
};

export default RoutineList;
