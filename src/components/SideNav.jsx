import React from 'react';
import { useTranslation } from 'react-i18next';

const SideNav = ({ activeTab, onTabChange }) => {
    const { t } = useTranslation();

    const tabs = [
        { id: '달력', label: t('nav.calendar'), icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        )},
        { id: '루틴구성', label: t('nav.routine'), icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        )},
        { id: 'AI코치', label: t('nav.aiCoach'), icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
        )},
        { id: 'analysis', label: t('nav.analysis'), icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        )}
    ];

    return (
        <aside className="fixed left-0 top-0 h-screen w-56 bg-slate-900 border-r border-white/10 flex flex-col z-50">
            <div className="p-6 border-b border-white/10">
                <h1 className="text-xl font-black italic text-white uppercase tracking-tighter">
                    My<span className="text-blue-500">Gym</span>
                </h1>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 ${
                                isActive
                                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                                    : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                            }`}
                        >
                            <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                                {tab.icon}
                            </span>
                            <span className="uppercase tracking-tight">{tab.label}</span>
                            {isActive && (
                                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />
                            )}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
};

export default SideNav;
