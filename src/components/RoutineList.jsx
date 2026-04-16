import React, { useState } from 'react';
import EXERCISE_DATASET from '../data/exercises.json';

/**
 * [Utility: Fuzzy Matching for Exercise GIFs]
 */
export const getExerciseGif = (nameEn) => {
    if (!nameEn) return null;
    
    const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const target = normalize(nameEn);
    
    // Fuzzy Match in Dataset
    const match = EXERCISE_DATASET.find(ex => {
        const source = normalize(ex.name);
        return source.includes(target) || target.includes(source);
    });
    
    if (match) {
        return `https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/${match.gif_url}`;
    }
    
    return null;
};

export const GifRenderer = ({ nameEn, className = "w-full h-full object-cover" }) => {
    const gifUrl = getExerciseGif(nameEn);
    
    if (!gifUrl) {
        return (
            <div className={`bg-slate-800 flex flex-col items-center justify-center gap-1 ${className}`}>
                <svg className="w-5 h-5 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            </div>
        );
    }
    
    return (
        <img 
            src={gifUrl} 
            alt="Exercise Preview" 
            className={className}
            loading="lazy"
        />
    );
};

const RoutineList = ({ data, onAddItem }) => {
    const [addedItems, setAddedItems] = useState([]);

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
                    <div key={itemIdx} className="flex gap-3 bg-slate-800/50 p-3 rounded-xl border border-white/5 group transition-all hover:border-indigo-500/30">
                        <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-white/5">
                            <GifRenderer nameEn={item.nameEn} />
                        </div>
                        <div className="flex-1 flex justify-between items-center">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-white font-black italic uppercase tracking-tighter text-base">
                                        {item.name}
                                    </span>
                                    {item.isDropSet && (
                                        <span className="bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded italic animate-pulse">D</span>
                                    )}
                                </div>
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                    {item.sets}세트 x {item.reps}회 {item.weight > 0 ? `(${item.weight}kg)` : ''}
                                </span>
                            </div>
                            <button 
                                onClick={() => handleItemClick(item, itemIdx)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
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
        </div>
    );
};

export default RoutineList;
