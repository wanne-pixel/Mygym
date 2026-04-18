import React from 'react';
import { getExerciseGif } from '../../utils/exerciseUtils';

/**
 * [Full-screen GIF Modal]
 */
export const GifModal = ({ isOpen, onClose, gifUrl, exerciseName }) => {
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

export const GifRenderer = ({ nameEn, exerciseId, className = "w-full h-full object-cover", onClick }) => {
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
