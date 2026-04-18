import React, { useState, useMemo } from 'react';
import EXERCISE_DATASET from '../../data/exercises.json';
import { BODY_PARTS, EQUIPMENT_MAP } from '../../constants/exerciseConstants';
import { getExerciseGif } from '../../utils/exerciseUtils';

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

export default ExerciseSelector;
