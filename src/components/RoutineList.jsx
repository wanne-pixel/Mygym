import React, { useState } from 'react';

const RoutineList = ({ data, onAddItem }) => {
    const [addedItems, setAddedItems] = useState([]);

    const handleItemClick = (item, itemIdx) => {
        if (addedItems.includes(itemIdx)) return;
        
        const success = onAddItem(item);
        if (success) {
            setAddedItems(prev => [...prev, itemIdx]);
        }
    };

    return (
        <div className="mt-4 space-y-2 bg-slate-900/50 p-3 rounded-2xl border border-white/5">
            <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 px-1">추천 루틴 리스트</div>
            {data.map((item, itemIdx) => {
                const isAdded = addedItems.includes(itemIdx);
                
                return (
                    <div key={itemIdx} className="flex justify-between items-center bg-slate-800/50 p-3 rounded-xl border border-white/5 group transition-all hover:border-indigo-500/30">
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
                );
            })}
        </div>
    );
};

export default RoutineList;
