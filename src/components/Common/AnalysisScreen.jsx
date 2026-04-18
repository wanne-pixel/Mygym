import React from 'react';

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

export default AnalysisScreen;
