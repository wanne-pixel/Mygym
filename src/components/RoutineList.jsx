import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getExerciseGif } from '../utils/exerciseUtils';
import { GifModal, GifRenderer } from './Common/GifUI';

const RoutineList = ({ data, onAddItem }) => {
    const { t } = useTranslation();
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
        } else {
            setModalState({ isOpen: true, gifUrl: '', name: name });
        }
    };

    return (
        <div className="mt-4 space-y-2 bg-slate-900/50 p-3 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center mb-3 px-1">
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">{t('aiCoach.guideTitle')}</div>
                <button 
                    onClick={handleApplyAll}
                    className="text-[9px] font-black text-white bg-indigo-600 hover:bg-indigo-500 px-2 py-1 rounded-md transition-all active:scale-95"
                >
                    {t('aiCoach.applyAllRoutine')}
                </button>
            </div>
            {data.map((item, itemIdx) => {
                const isAdded = addedItems.includes(itemIdx);
                
                return (
                    <div key={itemIdx} className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-white/5 group transition-all hover:border-indigo-500/30">
                        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/5 bg-slate-900 shadow-inner">
                            <GifRenderer 
                                nameEn={item.name_en} 
                                onClick={() => openPreview(item.name_en, item.name)} 
                            />
                        </div>
                        
                        <div className="flex-1 min-w-0 flex justify-between items-center">
                            <div className="flex flex-col min-w-0 pr-2">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-white font-black italic uppercase tracking-tighter text-sm truncate">
                                        {item.name}
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
