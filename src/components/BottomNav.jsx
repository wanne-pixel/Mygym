import React from 'react';

const BottomNav = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: '달력', label: '달력', icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        )},
        { id: '루틴기록', label: '루틴기록', icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        )},
        { id: '루틴구성', label: '루틴구성', icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        )},
        { id: 'AI코치', label: 'AI코치', icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        )}
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-xl border-t border-white/10 safe-area-bottom">
            <div className="max-w-2xl mx-auto flex justify-around items-center h-20">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative ${
                                isActive ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {isActive && (
                                <span className="absolute top-0 w-12 h-1 bg-blue-500 rounded-b-full shadow-lg shadow-blue-500/50 animate-fade-in" />
                            )}
                            <div className={`mb-1 transition-transform duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
                                {tab.icon}
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-tighter transition-all ${
                                isActive ? 'opacity-100 translate-y-0' : 'opacity-80'
                            }`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default BottomNav;
