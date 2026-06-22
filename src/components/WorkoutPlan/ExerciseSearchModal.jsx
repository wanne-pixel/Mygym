import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getGlobalExerciseCache, getLocalizedNameByKo, setGlobalExerciseCache } from '../../utils/exerciseUtils';
import { fetchAllExercises } from '../../api/exerciseApi';
import { ChevronRight, ArrowLeft, Loader2 } from 'lucide-react';

const ExerciseSearchModal = ({ isOpen, onClose, onAdd }) => {
    const { i18n } = useTranslation();

    const [step, setStep] = useState(1); // 1: 부위, 2: 기구, 3: 운동
    const [selectedBodyPart, setSelectedBodyPart] = useState('');
    const [selectedEquipment, setSelectedEquipment] = useState('');
    const [allExercises, setAllExercises] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Load exercises when modal opens
    useEffect(() => {
        if (!isOpen) return;
        const cached = getGlobalExerciseCache();
        if (cached && cached.length > 0) {
            setAllExercises(cached);
        } else {
            setIsLoading(true);
            fetchAllExercises()
                .then(data => {
                    setGlobalExerciseCache(data);
                    setAllExercises(data);
                })
                .catch(err => console.error('운동 데이터 로드 실패:', err))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen]);

    const bodyParts = useMemo(() => {
        const parts = new Set(allExercises.map(ex => ex.body_part).filter(Boolean));
        const order = ['가슴', '등', '하체', '어깨', '팔', '복근', '유산소'];
        return Array.from(parts).sort((a, b) => {
            const idxA = order.indexOf(a);
            const idxB = order.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return String(a).localeCompare(String(b));
        });
    }, [allExercises]);

    const availableEquipments = useMemo(() => {
        if (!selectedBodyPart) return [];
        const equips = new Set(
            allExercises
                .filter(ex => ex.body_part === selectedBodyPart)
                .map(ex => ex.equipment)
                .filter(Boolean)
        );
        const order = ['바벨', '덤벨', '머신', '스미스 머신', '케이블', '맨몸', '소도구'];
        return Array.from(equips).sort((a, b) => {
            const idxA = order.indexOf(a);
            const idxB = order.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return String(a).localeCompare(String(b));
        });
    }, [allExercises, selectedBodyPart]);

    const filteredExercises = useMemo(() => {
        if (!selectedBodyPart || !selectedEquipment) return [];
        return allExercises
            .filter(ex => ex.body_part === selectedBodyPart && ex.equipment === selectedEquipment)
            .slice(0, 60);
    }, [allExercises, selectedBodyPart, selectedEquipment]);

    // Early return AFTER all hooks
    if (!isOpen) return null;

    const handleBodyPartSelect = (part) => {
        setSelectedBodyPart(part);
        setSelectedEquipment('');
        setStep(2);
    };

    const handleEquipmentSelect = (equip) => {
        setSelectedEquipment(equip);
        setStep(3);
    };

    const handleSelect = (ex) => {
        onAdd(ex);
        handleClose();
    };

    const handleClose = () => {
        setStep(1);
        setSelectedBodyPart('');
        setSelectedEquipment('');
        onClose();
    };

    const handleBack = () => {
        if (step === 3) {
            setSelectedEquipment('');
            setStep(2);
        } else if (step === 2) {
            setSelectedBodyPart('');
            setStep(1);
        }
    };

    const stepLabels = ['부위 선택', '기구 선택', '운동 선택'];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">

                {/* Header */}
                <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {step > 1 && (
                            <button
                                onClick={handleBack}
                                className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <h3 className="text-lg font-black italic text-white uppercase">운동 추가</h3>
                            <p className="text-xs text-indigo-400 font-bold mt-0.5">STEP {step} / 3 · {stepLabels[step - 1]}</p>
                        </div>
                    </div>
                    <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors text-lg">
                        ✕
                    </button>
                </div>

                {/* Step Progress Bar */}
                <div className="flex h-1">
                    <div className={`h-full transition-all duration-300 ${step >= 1 ? 'bg-indigo-500' : 'bg-slate-700'}`} style={{ width: '33.3%' }} />
                    <div className={`h-full transition-all duration-300 ${step >= 2 ? 'bg-indigo-500' : 'bg-slate-700'}`} style={{ width: '33.3%' }} />
                    <div className={`h-full transition-all duration-300 ${step >= 3 ? 'bg-indigo-500' : 'bg-slate-700'}`} style={{ width: '33.4%' }} />
                </div>

                {/* Breadcrumb */}
                {step > 1 && (
                    <div className="px-5 py-3 bg-slate-950 flex items-center gap-2 text-sm font-bold border-b border-slate-800">
                        <span className="text-slate-500">가슴/등/...</span>
                        <ChevronRight className="w-4 h-4 text-slate-700" />
                        <span className={step === 2 ? 'text-indigo-400' : 'text-slate-400'}>{selectedBodyPart}</span>
                        {step === 3 && (
                            <>
                                <ChevronRight className="w-4 h-4 text-slate-700" />
                                <span className="text-indigo-400">{selectedEquipment}</span>
                            </>
                        )}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-950">

                    {isLoading && (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                            <p className="text-slate-400 text-sm font-bold">운동 데이터를 불러오는 중...</p>
                        </div>
                    )}

                    {/* STEP 1: Body Part */}
                    {!isLoading && step === 1 && (
                        <div className="grid grid-cols-2 gap-3">
                            {bodyParts.map(part => (
                                <button
                                    key={part}
                                    onClick={() => handleBodyPartSelect(part)}
                                    className="bg-slate-800 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-500 text-white font-bold py-5 px-4 rounded-2xl transition-all shadow-md active:scale-95 text-left flex justify-between items-center group"
                                >
                                    <span className="text-base">{part}</span>
                                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* STEP 2: Equipment */}
                    {!isLoading && step === 2 && (
                        <div className="grid grid-cols-2 gap-3">
                            {availableEquipments.map(equip => (
                                <button
                                    key={equip}
                                    onClick={() => handleEquipmentSelect(equip)}
                                    className="bg-slate-800 hover:bg-blue-600 border border-slate-700 hover:border-blue-500 text-white font-bold py-5 px-4 rounded-2xl transition-all shadow-md active:scale-95 text-left flex justify-between items-center group"
                                >
                                    <span className="text-base">{equip}</span>
                                    <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
                                </button>
                            ))}
                        </div>
                    )}

                    {/* STEP 3: Exercise List */}
                    {!isLoading && step === 3 && (
                        <div className="space-y-2">
                            {filteredExercises.length === 0 ? (
                                <div className="text-center text-slate-500 py-16 font-bold rounded-2xl border border-slate-800">
                                    조건에 맞는 운동이 없습니다.
                                </div>
                            ) : (
                                filteredExercises.map(ex => (
                                    <button
                                        key={ex.id}
                                        onClick={() => handleSelect(ex)}
                                        className="w-full text-left px-5 py-4 rounded-xl hover:bg-indigo-600/20 hover:border-indigo-500/50 border border-slate-800 transition-all flex justify-between items-center group bg-slate-900"
                                    >
                                        <span className="text-white font-bold text-sm">
                                            {getLocalizedNameByKo(ex.name, i18n.language)}
                                        </span>
                                        <div className="text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold text-xs bg-indigo-500/20 px-3 py-1.5 rounded-lg whitespace-nowrap ml-2">
                                            + 추가
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExerciseSearchModal;
