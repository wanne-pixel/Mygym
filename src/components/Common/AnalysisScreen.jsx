import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../api/supabase';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { BarChart3, TrendingUp, Sparkles, BrainCircuit, Target, Check, RefreshCw } from 'lucide-react';
import { fetchAllExercises } from '../../api/exerciseApi';
import { toast } from 'sonner';

const COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
    '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'
];

const BODY_PARTS = ['전체', '가슴', '등', '어깨', '하체', '팔', '복부', '유산소'];

const AnalysisScreen = () => {
    const { t } = useTranslation();
    const [logs, setLogs] = useState([]);
    const [exerciseDataset, setExerciseDataset] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('전체');
    const [aiAnalysis, setAiAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
                const [logsRes, dataset] = await Promise.all([
                    supabase
                        .from('workout_logs')
                        .select('*')
                        .eq('user_id', user.id)
                        .gte('created_at', thirtyDaysAgo)
                        .order('created_at', { ascending: false }),
                    fetchAllExercises()
                ]);

                if (logsRes.error) throw logsRes.error;
                setLogs(logsRes.data || []);
                setExerciseDataset(dataset || []);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const exerciseToPart = useMemo(() => {
        const mapping = {};
        exerciseDataset.forEach(ex => {
            const part = ex.body_part || ex.bodyPart;
            mapping[ex.name] = part;
            if (ex.equipment) {
                mapping[`${ex.name} (${ex.equipment})`] = part;
            }
        });
        return mapping;
    }, [exerciseDataset]);

    const stats = useMemo(() => {
        if (!logs.length) return null;

        const volumeMap = {};
        const exerciseVolumeMap = {};
        let totalVolume = 0;

        logs.forEach(log => {
            const part = log.part || exerciseToPart[log.exercise] || '기타';
            let sets = [];
            try { sets = typeof log.sets_data === 'string' ? JSON.parse(log.sets_data) : (log.sets_data || []); } 
            catch (e) {}

            const vol = sets.reduce((acc, s) => acc + (parseFloat(s.kg) || 0) * (parseInt(s.reps) || 0), 0);
            
            volumeMap[part] = (volumeMap[part] || 0) + vol;
            if (!exerciseVolumeMap[part]) exerciseVolumeMap[part] = {};
            exerciseVolumeMap[part][log.exercise] = (exerciseVolumeMap[part][log.exercise] || 0) + vol;
            totalVolume += vol;
        });

        let pieData = [];
        let totalRenderedVolume = 0;

        if (filter === '전체') {
            pieData = Object.entries(volumeMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
            totalRenderedVolume = totalVolume;
        } else {
            const exMap = exerciseVolumeMap[filter] || {};
            pieData = Object.entries(exMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
            totalRenderedVolume = volumeMap[filter] || 0;
        }

        const pieDataWithPercent = pieData.map(d => ({
            ...d,
            percent: totalRenderedVolume > 0 ? Math.round((d.value / totalRenderedVolume) * 100) : 0
        }));

        const uniqueDays = new Set(logs.map(l => l.created_at.split('T')[0])).size;
        const weeklyFrequency = ((uniqueDays / 30) * 7).toFixed(1);

        return { volumeMap, pieData: pieDataWithPercent, totalRenderedVolume, uniqueDays, weeklyFrequency };
    }, [logs, exerciseToPart, filter]);

    const requestAiAnalysis = async () => {
        if (!stats) return;
        try {
            setIsAnalyzing(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");

            const payload = {
                type: 'training_analysis',
                total_workouts: logs.length,
                muscle_stats: stats.volumeMap,
                day_stats: logs.map(l => l.created_at.split('T')[0]),
                weekly_frequency: stats.weeklyFrequency,
                period_days: 30
            };

            const response = await supabase.functions.invoke('ai-coach', {
                body: payload,
                headers: { Authorization: `Bearer ${session.access_token}` }
            });

            if (response.error) throw response.error;
            let result = response.data.parsedData;
            if (!result && response.data.content) {
                try { result = JSON.parse(response.data.content); } catch(e){}
            }
            if (result) {
                setAiAnalysis(result);
            } else {
                throw new Error("Invalid response format");
            }
        } catch (err) {
            console.error('AI Analysis Error:', err);
            toast.error(t('analysis.aiError', { defaultValue: 'AI 분석 중 오류가 발생했습니다.' }));
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <BarChart3 size={48} className="text-slate-700 mb-4" />
                <h3 className="text-xl font-bold text-slate-400">데이터가 없습니다</h3>
                <p className="text-slate-600 text-sm mt-2">최근 30일간의 운동 기록이 필요합니다.</p>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-8 space-y-8 animate-in fade-in duration-500 pb-24 lg:pb-8">
            <h1 className="text-3xl font-black italic text-white uppercase underline decoration-blue-500 decoration-4 underline-offset-8 mb-8 flex items-center justify-center gap-3">
                <BarChart3 className="text-blue-500 w-8 h-8" />
                {t('analysis.title', { defaultValue: '분석' })}
            </h1>

            {/* 필터 탭 */}
            <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-2">
                {BODY_PARTS.map(part => (
                    <button
                        key={part}
                        onClick={() => setFilter(part)}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                            filter === part 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                            : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                        }`}
                    >
                        {t(`bodyParts.${part}`, { defaultValue: part })}
                    </button>
                ))}
            </div>

            {/* 도넛 차트 컨테이너 */}
            <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6">
                <div className="h-48 w-full mb-6">
                    {stats.pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={stats.pieData}
                                    cx="50%" cy="50%"
                                    innerRadius={55} outerRadius={75}
                                    paddingAngle={2}
                                    dataKey="value" stroke="none"
                                >
                                    {stats.pieData.map((entry, index) => (
                                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-500 text-sm font-medium">
                            해당 부위의 데이터가 없습니다.
                        </div>
                    )}
                </div>

                {/* 차트 범례 리스트 */}
                <div className="space-y-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {stats.pieData.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                <span className="text-sm font-bold text-slate-200">
                                    {filter === '전체' ? t(`bodyParts.${item.name}`, { defaultValue: item.name }) : item.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-black text-slate-400 w-8 text-right">{item.percent}%</span>
                                <span className="text-xs font-medium text-slate-500 w-16 text-right">{item.value.toLocaleString()}kg</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* AI 훈련 분석 컨테이너 */}
            <div className="bg-slate-900/50 border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <BrainCircuit size={100} />
                </div>
                
                <h3 className="text-lg font-black text-white italic flex items-center gap-2 mb-6">
                    <Sparkles className="text-blue-400" size={20} />
                    AI 훈련 분석 결과
                </h3>

                {!aiAnalysis ? (
                    <div className="flex flex-col items-center justify-center py-8">
                        <button
                            onClick={requestAiAnalysis}
                            disabled={isAnalyzing}
                            className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black italic tracking-wide transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
                        >
                            {isAnalyzing ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    분석 중...
                                </>
                            ) : (
                                <>
                                    <BrainCircuit size={20} />
                                    AI 훈련 분석 요청
                                </>
                            )}
                        </button>
                        <p className="text-xs text-slate-500 mt-4 font-medium">
                            최근 30일간의 데이터를 바탕으로 훈련 패턴을 분석합니다.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        {/* Summary */}
                        <div>
                            <h4 className="text-blue-400 font-bold text-sm mb-2">{aiAnalysis.title}</h4>
                            <p className="text-slate-300 text-sm leading-relaxed">{aiAnalysis.summary}</p>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-slate-800/40 p-4 rounded-2xl border border-white/5">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">훈련 강도</span>
                                <span className="text-lg font-black text-white italic">{Math.round(stats.totalRenderedVolume / Math.max(logs.length, 1))}</span>
                                <span className="text-[10px] text-slate-400 ml-1">kg/회</span>
                            </div>
                            <div className="bg-slate-800/40 p-4 rounded-2xl border border-white/5">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">부위 균형</span>
                                <span className="text-lg font-black text-white italic">{stats.pieData[0]?.name || '-'}</span>
                                <span className="text-[10px] text-slate-400 ml-1">집중</span>
                            </div>
                            <div className="bg-slate-800/40 p-4 rounded-2xl border border-white/5">
                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">일관성</span>
                                <span className="text-lg font-black text-white italic">{stats.uniqueDays}</span>
                                <span className="text-[10px] text-slate-400 ml-1">일/월</span>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="bg-green-900/10 border border-green-500/20 rounded-2xl p-4 space-y-3">
                            <h5 className="text-xs font-black text-green-400 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                                <Target size={14} />
                                개선 제안
                            </h5>
                            {Array.isArray(aiAnalysis.recommendations) && aiAnalysis.recommendations.map((rec, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                    <div className="mt-0.5 w-4 h-4 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                                        <Check size={10} className="text-green-400" />
                                    </div>
                                    <p className="text-sm text-slate-300 leading-relaxed font-medium">{rec}</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button 
                                onClick={requestAiAnalysis}
                                disabled={isAnalyzing}
                                className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-400 transition-colors"
                            >
                                <RefreshCw size={12} className={isAnalyzing ? 'animate-spin' : ''} />
                                다시 분석
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalysisScreen;