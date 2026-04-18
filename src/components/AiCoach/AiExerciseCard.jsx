import React, { useState } from 'react';
import { Check, Plus } from 'lucide-react';

const AiExerciseCard = ({ exercise, mode, onAdd }) => {
    const [isAdded, setIsAdded] = useState(false);
    
    const handleAdd = () => {
        onAdd(exercise, mode === 'hard');
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);
    };
    
    return (
        <button
            onClick={handleAdd}
            disabled={isAdded}
            className={`flex-shrink-0 w-32 bg-blue-600/10 hover:bg-blue-600/20 border rounded-xl p-3 text-left transition-all ${
                isAdded ? 'border-green-500 bg-green-600/10' : 'border-blue-500/30'
            }`}
        >
            <div className="flex items-start justify-between gap-1 mb-2">
                <p className="font-bold text-white text-[11px] leading-tight line-clamp-2 uppercase italic">
                    {exercise.name}
                </p>
                {isAdded ? (
                    <Check size={16} className="text-green-400 flex-shrink-0" />
                ) : (
                    <Plus size={16} className="text-blue-400 flex-shrink-0" />
                )}
            </div>
            
            <p className="text-[9px] font-black text-blue-500/70 mb-2 uppercase tracking-tighter">{exercise.part}</p>
            
            {mode !== 'balanced' && (
                <div className="text-[9px] font-bold text-slate-400 space-y-0.5">
                    <div>{exercise.sets?.length || 0}세트</div>
                    {exercise.sets?.[0] && exercise.sets[0].kg > 0 && (
                        <div>{exercise.sets[0].kg}kg × {exercise.sets[0].reps}회</div>
                    )}
                    {exercise.sets?.[0] && !exercise.sets[0].kg && exercise.sets[0].reps > 0 && (
                        <div>{exercise.sets[0].reps}회</div>
                    )}
                </div>
            )}
        </button>
    );
};

export default AiExerciseCard;
