import React from 'react';
import { BrainCircuit, Wrench } from 'lucide-react';

const CoachPage = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center animate-in fade-in duration-500">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
                <BrainCircuit size={80} className="text-blue-500 relative z-10 animate-pulse" />
            </div>
            
            <h1 className="text-3xl md:text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 uppercase tracking-tighter mb-4">
                AI 코칭 시스템 준비 중...
            </h1>
            
            <p className="text-slate-400 text-lg max-w-md mx-auto leading-relaxed font-medium">
                당신의 데이터를 기반으로 최적의 루틴을 제안해 줄 AI 코치가 곧 찾아옵니다.
            </p>
            
            <div className="mt-12 flex items-center justify-center gap-2 text-slate-500 text-sm font-bold bg-slate-800/50 px-4 py-2 rounded-full border border-slate-700/50">
                <Wrench size={16} />
                <span>Under Construction</span>
            </div>
        </div>
    );
};

export default CoachPage;
