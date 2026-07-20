import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../api/supabase';
import SideNav from '../SideNav';
import BottomNav from '../BottomNav';
import CalendarScreen from '../Calendar/CalendarScreen';
import WorkoutPlanScreen from '../WorkoutPlan/WorkoutPlanScreen';
import AnalysisScreen from '../Common/AnalysisScreen';

import BetaNoticeModal, { shouldShowBetaModal } from '../Common/BetaNoticeModal';
import CoachPage from '../../pages/CoachPage';
import AiBottomSheet from '../AiCoach/AiBottomSheet';
import { useAiChat } from '../../hooks/useAiChat';
import { Bot } from 'lucide-react';

// 언어 전환 컴포넌트 (레이아웃에 종속적이므로 함께 이동)
const LangSwitcher = () => {
    const { i18n } = useTranslation();
    const toggle = () => {
        const next = i18n.language === 'ko' ? 'en' : 'ko';
        i18n.changeLanguage(next);
        localStorage.setItem('mygym_lang', next);
    };
    return (
        <button
            onClick={toggle}
            className="flex items-center px-3 py-2 bg-slate-900/90 backdrop-blur-sm border border-white/10 text-slate-400 hover:text-white hover:border-white/20 rounded-xl text-xs font-bold transition-all"
        >
            {i18n.language === 'ko' ? 'EN' : '한'}
        </button>
    );
};

const MainLayout = () => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || '달력';
    const handleTabChange = (tab) => setSearchParams({ tab });

    const [isBetaModalOpen, setIsBetaModalOpen] = useState(shouldShowBetaModal);
    const [isCalendarDetail, setIsCalendarDetail] = useState(false);
    const { openChat } = useAiChat();

    return (
        <div className="relative min-h-screen bg-slate-950">
            {/* PC: 좌측 사이드바 */}
            <div className="hidden lg:block">
                <SideNav activeTab={activeTab} onTabChange={handleTabChange} />
            </div>

            {/* PC: 우측 상단 고정 버튼 영역 */}
            <div className="hidden lg:flex fixed top-4 right-6 z-50 items-center gap-2">
                <LangSwitcher />
                <button
                    onClick={async () => {
                        if (window.confirm(t('nav.logoutConfirm'))) {
                            await supabase.auth.signOut();
                            localStorage.clear();
                        }
                    }}
                    className="flex items-center gap-2 px-3 py-2 bg-slate-900/90 backdrop-blur-sm border border-white/10 text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-900/10 rounded-xl text-xs font-bold transition-all"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    {t('nav.logout')}
                </button>
            </div>

            {/* 메인 콘텐츠 영역 */}
            <main className="lg:ml-56">
                {activeTab === '달력' && <CalendarScreen onSelectedDateChange={(date) => setIsCalendarDetail(!!date)} />}
                {activeTab === '운동' && <WorkoutPlanScreen />}
                {activeTab === 'analysis' && <AnalysisScreen />}
                {activeTab === '코치' && <CoachPage />}
            </main>

            {/* 모바일: 하단 탭바 */}
            <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />



            {/* AI 코치 FAB 및 Bottom Sheet (코치 탭에서는 숨김) */}
            {activeTab !== '코치' && (
                <>
                    <button
                        onClick={openChat}
                        className="fixed bottom-24 lg:bottom-8 right-4 z-50 flex items-center justify-center w-14 h-14 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all active:scale-95 border border-indigo-400/30"
                        title="AI 코치"
                    >
                        <Bot size={28} />
                    </button>
                    <AiBottomSheet />
                </>
            )}

            {/* 베타 공지 모달 */}
            <BetaNoticeModal isOpen={isBetaModalOpen} onClose={() => setIsBetaModalOpen(false)} />

            {/* 개인정보처리방침 푸터 링크 - 달력 탭에서만 표시 */}
            {activeTab === '달력' && !isCalendarDetail && (
            <div className="fixed bottom-[84px] lg:bottom-3 left-0 right-0 lg:ml-56 flex justify-center z-40 pointer-events-none">
                <a
                    href="https://shell-locust-532.notion.site/MyGym-2ea3913a10d080a69587f5da233e965f"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pointer-events-auto text-xs text-slate-700 hover:text-slate-400 underline underline-offset-2 break-keep transition-colors px-2 py-1"
                >
                    {t('privacy.footerLink')}
                </a>
            </div>
            )}
        </div>
    );
};

export default MainLayout;