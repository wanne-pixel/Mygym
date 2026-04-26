import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../api/supabase';
import SideNav from '../SideNav';
import BottomNav from '../BottomNav';
import CalendarScreen from '../Calendar/CalendarScreen';
import WorkoutPlanScreen from '../WorkoutPlan/WorkoutPlanScreen';
import AIRecommendationScreen from '../AiCoach/AiRecommendationScreen';
import AnalysisScreen from '../Common/AnalysisScreen';
import FeedbackModal from '../Common/FeedbackModal';
import BetaNoticeModal, { shouldShowBetaModal } from '../Common/BetaNoticeModal';

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
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [isBetaModalOpen, setIsBetaModalOpen] = useState(shouldShowBetaModal);

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
                {activeTab === '달력' && <CalendarScreen />}
                {activeTab === '루틴구성' && <WorkoutPlanScreen />}
                {activeTab === 'AI코치' && <AIRecommendationScreen />}
                {activeTab === 'analysis' && <AnalysisScreen />}
            </main>

            {/* 모바일: 하단 탭바 */}
            <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

            {/* 플로팅 건의/문의 버튼 */}
            <button
                onClick={() => setIsFeedbackOpen(true)}
                className="fixed bottom-24 lg:bottom-8 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-slate-800/90 backdrop-blur-sm border border-white/10 text-slate-300 hover:text-white hover:border-white/20 hover:bg-slate-700/90 rounded-2xl text-xs font-bold shadow-lg transition-all active:scale-95 break-keep"
                title={t('feedback.floatingButton')}
            >
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <span className="hidden sm:inline">{t('feedback.floatingButton')}</span>
            </button>

            {/* 건의/문의 모달 */}
            <FeedbackModal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} />

            {/* 베타 공지 모달 */}
            <BetaNoticeModal isOpen={isBetaModalOpen} onClose={() => setIsBetaModalOpen(false)} />

            {/* 개인정보처리방침 푸터 링크 */}
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
        </div>
    );
};

export default MainLayout;