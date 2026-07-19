import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, Brain, ChevronRight } from 'lucide-react';

const LandingPage = ({ session }) => {
    const navigate = useNavigate();

    const handleCtaClick = () => {
        if (session) {
            navigate('/app');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden">
            {/* Header/Nav */}
            <header className="fixed top-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="text-2xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">
                        MyGym
                    </div>
                    <button 
                        onClick={handleCtaClick}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors"
                    >
                        {session ? '앱으로 이동' : '로그인'}
                    </button>
                </div>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 flex flex-col items-center text-center min-h-[80vh] justify-center">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px]" />
                    <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-indigo-600/20 rounded-full blur-[100px]" />
                </div>
                
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative z-10 max-w-4xl mx-auto"
                >
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
                        당신의 완벽한 <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500 italic">점진적 과부하</span> 파트너
                    </h1>
                    <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto font-medium">
                        더 이상 감으로 운동하지 마세요. MyGym이 당신의 한계를 측정하고, AI 기반 루틴으로 성장을 이끕니다.
                    </p>
                    
                    <motion.button 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCtaClick}
                        className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-2xl shadow-lg shadow-blue-600/25 overflow-hidden transition-all"
                    >
                        <span className="relative z-10">무료로 시작하기</span>
                        <ChevronRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.button>
                </motion.div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-6 bg-slate-900/50 border-y border-white/5 relative z-10 min-h-[500px]">
                <div className="max-w-7xl mx-auto">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">성장을 위한 핵심 기능</h2>
                        <p className="text-slate-400">데이터 기반으로 가장 효율적인 훈련을 경험하세요.</p>
                    </motion.div>

                    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
                        {/* Feature 1: AI Coach */}
                        <motion.div 
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 hover:border-blue-500/30 transition-colors"
                        >
                            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6">
                                <Brain className="w-7 h-7 text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">AI 맞춤형 루틴 추천</h3>
                            <p className="text-slate-400 leading-relaxed">
                                사용자의 운동 수행 능력을 분석하여 매일 최적화된 중량과 횟수를 제안합니다. 당신의 성장에 맞춰 진화하는 AI 코치를 만나보세요.
                            </p>
                        </motion.div>

                        {/* Feature 2: Volume & PR Tracking */}
                        <motion.div 
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, margin: "-100px" }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            className="bg-slate-800/50 border border-slate-700/50 rounded-3xl p-8 hover:border-indigo-500/30 transition-colors"
                        >
                            <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6">
                                <TrendingUp className="w-7 h-7 text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold mb-3">볼륨 트래킹 & PR 차트</h3>
                            <p className="text-slate-400 leading-relaxed">
                                운동 부위별 볼륨을 직관적인 차트로 확인하고 점진적 과부하 원칙이 잘 지켜지고 있는지 한눈에 파악할 수 있습니다.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Bottom CTA */}
            <section className="py-32 px-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <h2 className="text-3xl md:text-5xl font-black italic tracking-tighter mb-8">
                        READY TO LEVEL UP?
                    </h2>
                    <button 
                        onClick={handleCtaClick}
                        className="px-10 py-5 bg-white text-slate-900 font-bold text-xl rounded-2xl hover:bg-slate-200 transition-colors shadow-xl shadow-white/10"
                    >
                        지금 바로 시작하기
                    </button>
                </motion.div>
            </section>
        </div>
    );
};

export default LandingPage;
