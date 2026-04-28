import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Award, Zap, Trophy, ChevronDown, ChevronUp,
  Loader2, Brain, Lightbulb, Sparkles,
  BarChart3, PieChart as PieChartIcon,
  TrendingUp, Target, Calendar
} from 'lucide-react';
import {
  PieChart, Pie, Tooltip, ResponsiveContainer
} from 'recharts';
import { supabase } from '../../api/supabase';
import { fetchAllExercises } from '../../api/exerciseApi'; // DB 연동 API 추가
import { getLocalizedNameByKo } from '../../utils/exerciseUtils';

const MUSCLE_KEY_MAP = {
  '전체': 'all',
  '가슴': 'chest',
  '등': 'back',
  '어깨': 'shoulder',
  '하체': 'lower',
  '팔': 'arms',
  '코어': 'core',
};

// ─── 상수 ─────────────────────────────────────────────────────────────────────

const MUSCLE_TABS = ['전체', '가슴', '등', '어깨', '하체', '팔', '코어'];

const MUSCLE_COLORS = {
  '가슴': '#3b82f6',
  '등': '#8b5cf6',
  '어깨': '#ec4899',
  '하체': '#f59e0b',
  '팔': '#10b981',
  '코어': '#06b6d4',
};

const SUB_CAT_COLORS = {
  '상부': '#60a5fa', '중부': '#3b82f6', '하부': '#2563eb',
  '넓이': '#a78bfa', '두께': '#7c3aed', '승모근': '#6d28d9',
  '전면': '#f472b6', '측면': '#ec4899', '후면': '#db2777',
  '대퇴사두근': '#fb923c', '햄스트링/둔근': '#f59e0b', '종아리': '#ea580c',
  '이두근': '#34d399', '삼두근': '#10b981', '전완근': '#059669',
  '복직근': '#22d3ee', '복사근/회전': '#06b6d4',
  '기타': '#94a3b8',
  '광배근': '#a78bfa', '척추기립근': '#94a3b8',
  // 영어 대응
  'Upper': '#60a5fa', 'Mid': '#3b82f6', 'Lower': '#2563eb',
  'Width': '#a78bfa', 'Thickness': '#7c3aed', 'Traps': '#6d28d9',
  'Front': '#f472b6', 'Side': '#ec4899', 'Rear': '#db2777',
  'Quads': '#fb923c', 'Hamstrings/Glutes': '#f59e0b', 'Calves': '#ea580c',
  'Biceps': '#34d399', 'Triceps': '#10b981', 'Forearms': '#059669',
  'Rectus Abdominis': '#22d3ee', 'Obliques': '#06b6d4',
  'Lats': '#a78bfa', 'Erector Spinae': '#94a3b8'
};

// ─── 헬퍼 함수 ───────────────────────────────────────────────────────────────

// EXERCISE_DATASET을 인자로 받도록 수정
const getSubCategory = (exerciseName, lang, dataset = []) => {
  const ex = dataset.find(e => 
    e.name === exerciseName || 
    e.name_en === exerciseName ||
    e.name?.replace(/\s/g, '') === exerciseName?.replace(/\s/g, '')
  );
  if (!ex) return lang === 'en' ? 'Other' : '기타';
  return lang === 'en' ? (ex.subTarget_en || 'Other') : (ex.subTarget_ko || '기타');
};

const calc1RM = (weight, reps) => {
  if (!weight || !reps || reps <= 0) return 0;
  return Math.round(weight * (1 + reps / 30));
};

const formatDateFull = (dateStr) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const daysSince = (dateStr) => (new Date() - new Date(dateStr)) / (1000 * 60 * 60 * 24);

const normalizePart = (part) => {
  if (!part) return '기타';
  const p = part.trim();
  if (/가슴|chest|벤치/.test(p)) return '가슴';
  if (/등|back|광배|데드/.test(p)) return '등';
  if (/어깨|shoulder|삼각/.test(p)) return '어깨';
  if (/하체|leg|스쿼트|햄|둔근|허벅/.test(p)) return '하체';
  if (/팔|arm|이두|삼두|bicep|tricep/.test(p)) return '팔';
  if (/코어|core|복근|abs|허리/.test(p)) return '코어';
  return '기타';
};

const calcLogVolume = (setsData) => {
  let sds = setsData;
  if (typeof sds === 'string') { try { sds = JSON.parse(sds); } catch { return 0; } }
  if (!Array.isArray(sds)) return 0;
  return sds.reduce((sum, set) => {
    const w = parseFloat(set.kg || set.weight || 0);
    const r = parseInt(set.reps || 0);
    return sum + w * r;
  }, 0);
};

// ─── PRCard ───────────────────────────────────────────────────────────────────

const PRCard = ({ pr, dataset }) => {
  const { t, i18n } = useTranslation();
  const days = daysSince(pr.date);
  const isNew = days <= 7;
  const isRecent = days <= 30;
  const subTarget = getSubCategory(pr.exercise, i18n.language, dataset);

  return (
    <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
      isNew ? 'bg-blue-500/10 border-blue-500/30'
        : isRecent ? 'bg-yellow-500/10 border-yellow-500/20'
        : 'bg-slate-900 border-slate-800'
    }`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
        isNew ? 'bg-blue-500/20' : isRecent ? 'bg-yellow-500/15' : 'bg-slate-800'
      }`}>
        <Trophy size={18} className={isNew ? 'text-blue-400' : isRecent ? 'text-yellow-400' : 'text-slate-500'} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-black text-sm truncate">{getLocalizedNameByKo(pr.exercise, i18n.language)}</span>
          <span className="text-[11px] text-slate-500 font-medium shrink-0">({subTarget})</span>
          {isNew && (
            <span className="text-[9px] font-black text-blue-400 bg-blue-400/15 px-2 py-0.5 rounded-full uppercase tracking-widest flex-shrink-0">{t('common.new')}</span>
          )}
          {!isNew && isRecent && (
            <span className="text-[9px] font-black text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest flex-shrink-0">{t('analysis.last30Days')}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-blue-400 font-black text-base">{pr.weight}kg</span>
          <span className="text-slate-500 text-xs font-bold">× {pr.reps}{t('dayDetail.repsUnit')}</span>
          {pr.sets > 1 && <span className="text-slate-600 text-xs">/ {pr.sets}{t('workout.sets')}</span>}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-slate-500 text-xs font-bold">{formatDateFull(pr.date)}</div>
        <div className="text-slate-600 text-[11px] mt-0.5">{t('analysis.oneRepMax')}{calc1RM(pr.weight, pr.reps)}kg</div>
      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-800 rounded-xl ${className}`} />
);

// ─── 더보기 버튼 ──────────────────────────────────────────────────────────────

const ShowMoreBtn = ({ expanded, count, onClick }) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="mt-3 w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-blue-400 text-xs font-black hover:bg-slate-800 transition-all active:scale-95"
    >
      {expanded ? <><ChevronUp size={15} />{t('common.collapse')}</> : <><ChevronDown size={15} />{t('common.showMore')} ({count})</>}
    </button>
  );
};

// ─── 도넛 차트 범례 ──────────────────────────────────────────────────────────

const DonutLegend = ({ items, colorMap }) => (
  <div className="flex flex-col gap-3 mt-5">
    {items.map(item => (
      <div key={item.name} className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'rgba(51,65,85,0.3)' }}>
        <div
          className="w-4 h-4 rounded flex-shrink-0"
          style={{ backgroundColor: colorMap[item.name] || '#94a3b8' }}
        />
        <span className="flex-1 text-sm font-medium text-slate-200">{item.name}</span>
        <span className="text-sm font-semibold text-slate-400">
          {item.percentage}% ({item.value.toLocaleString()}kg)
        </span>
      </div>
    ))}
  </div>
);

// ─── 부위별 볼륨 분포 (전체 탭) ───────────────────────────────────────────────

const VolumeDistributionSection = ({ logs }) => {
  const { t } = useTranslation();
  const data = useMemo(() => {
    const volMap = {};
    logs.forEach(log => {
      const group = normalizePart(log.part);
      if (group === '기타') return;
      volMap[group] = (volMap[group] || 0) + calcLogVolume(log.sets_data);
    });

    const total = Object.values(volMap).reduce((s, v) => s + v, 0);
    if (total === 0) return [];
    return MUSCLE_TABS
      .filter(tab => tab !== '전체' && volMap[tab] > 0)
      .map(tab => ({
        name: tab,
        label: t(`bodyParts.${MUSCLE_KEY_MAP[tab] || tab}`, { defaultValue: tab }),
        value: Math.round(volMap[tab]),
        percentage: Math.round((volMap[tab] / total) * 100),
        fill: MUSCLE_COLORS[tab] || '#94a3b8',
      }))
      .sort((a, b) => b.value - a.value);
  }, [logs, t]);

  if (!data.length) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 size={16} className="text-blue-400" />
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('analysis.volumeDistribution')}</h3>
        <span className="text-[10px] font-bold text-slate-600 ml-auto">{t('analysis.allPeriod')}</span>
      </div>
      <div className="my-5">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ label, percentage }) => `${label} ${percentage}%`}
              labelLine={true}
            />
            <Tooltip
              formatter={(value) => `${value.toLocaleString()}kg`}
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <DonutLegend items={data.map(d => ({ ...d, name: d.label }))} colorMap={MUSCLE_COLORS} />
      </div>
      <p className="text-slate-600 text-[11px] mt-3 text-center font-bold">
        {t('analysis.totalRecords')}{logs.length}{t('analysis.recordsSuffix')}
      </p>
    </section>
  );
};

// ─── 서브카테고리 분석 + AI 인사이트 ─────────────────────────────────────────

const MuscleDetailAnalysis = ({ muscleGroup, logs, token, dataset }) => {
  const { t, i18n } = useTranslation();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    setAiAnalysis(null);
    setAiError(null);
  }, [muscleGroup]);

  const subCategoryData = useMemo(() => {
    const filtered = logs.filter(log => {
      const exInfo = dataset.find(e => e.name?.trim().toLowerCase() === log.exercise?.trim().toLowerCase());
      return normalizePart(exInfo?.bodyPart || exInfo?.body_part || log.part) === muscleGroup;
    });
    const volMap = {};
    const cntMap = {};

    filtered.forEach(log => {
      const sub = getSubCategory(log.exercise, i18n.language, dataset);
      const vol = calcLogVolume(log.sets_data);
      volMap[sub] = (volMap[sub] || 0) + vol;
      cntMap[sub] = (cntMap[sub] || 0) + 1;
    });

    const total = Object.values(volMap).reduce((s, v) => s + v, 0);
    if (total === 0) return [];

    return Object.entries(volMap)
      .map(([cat, vol]) => ({
        name: cat,
        label: t(`subCategories.${cat}`, { defaultValue: cat }),
        value: Math.round(vol),
        count: cntMap[cat],
        percentage: Math.round((vol / total) * 100),
        fill: SUB_CAT_COLORS[cat] || '#94a3b8',
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [muscleGroup, logs, t, i18n.language, dataset]);

  const runAnalysis = async () => {
    if (!subCategoryData.length || !token) return;
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: {
          type: 'muscle_analysis',
          lang: i18n.language,
          muscle_group: muscleGroup,
          breakdown: subCategoryData.map(d => ({
            category: d.name,
            volume: d.value,
            count: d.count,
            percentage: d.percentage,
          })),
          total_exercises: subCategoryData.reduce((s, d) => s + d.count, 0),
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (error) {
          console.error('[Muscle Analysis Function Error]:', error);
          throw error;
      }
      
      const content = data?.content || data?.reply;
      if (!content) throw new Error('No analysis content received');

      const parsed = typeof content === 'string' ? JSON.parse(content) : content;
      setAiAnalysis(parsed.analysis || parsed);
    } catch (err) {
      console.error('[Muscle Analysis Exception]:', err);
      setAiError(t('analysis.aiFailed'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!subCategoryData.length) return (
    <p className="text-center py-8 text-slate-500 text-sm font-bold">
      {i18n.language === 'en' ? 'No workout records for this muscle group.' : '해당 부위의 운동 기록이 없습니다.'}
    </p>
  );

  return (
    <section>
      {/* 서브카테고리 도넛 차트 */}
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon size={16} className="text-blue-400" />
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {t(`bodyParts.${MUSCLE_KEY_MAP[muscleGroup] || muscleGroup}`, { defaultValue: muscleGroup })} {t('analysis.detailedDistribution')}
        </h3>
      </div>
      <div className="my-5">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={subCategoryData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ label, percentage }) => `${label} ${percentage}%`}
              labelLine={true}
            />
            <Tooltip
              formatter={(value) => `${value.toLocaleString()}kg`}
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #334155',
                borderRadius: '8px',
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <DonutLegend items={subCategoryData.map(d => ({ ...d, name: d.label }))} colorMap={SUB_CAT_COLORS} />
      </div>

      {/* AI 분석 */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-4">
          <Brain size={16} className="text-purple-400" />
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('analysis.aiInsights')}</h3>
          {!aiAnalysis && (
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing || !token}
              className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white disabled:opacity-40 transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
            >
              {isAnalyzing ? (
                <><Loader2 size={13} className="animate-spin" />{t('common.processing')}</>
              ) : (
                <><Sparkles size={13} />{t('analysis.aiAnalysisRequest')}</>
              )}
            </button>
          )}
        </div>

        {!aiAnalysis && !isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <Brain size={36} className="text-slate-700" />
            <p className="text-white font-black text-sm">{t('analysis.aiPrompt')}</p>
            <p className="text-slate-500 text-xs font-bold">{t('analysis.aiPromptDesc')}</p>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex items-center justify-center gap-3 py-6 bg-slate-900 border border-slate-800 rounded-2xl">
            <Loader2 size={18} className="animate-spin text-purple-400" />
            <span className="text-slate-400 text-xs font-bold">{t('analysis.aiAnalyzing')}</span>
          </div>
        )}

        {aiAnalysis && (
          <div className="bg-purple-500/10 border border-purple-500/25 rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Brain size={15} className="text-purple-400" />
              </div>
              <div>
                <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest">{t('analysis.aiInsights')}</div>
                <div className="text-white font-black text-sm mt-0.5">{aiAnalysis.title}</div>
              </div>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed mb-3">{aiAnalysis.summary}</p>
            <div className="flex items-start gap-2.5 bg-slate-900/60 rounded-xl p-3">
              <Lightbulb size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-slate-300 text-xs leading-relaxed">{aiAnalysis.advice}</p>
            </div>
            <button
              onClick={runAnalysis}
              className="mt-3 text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors"
            >
              {t('analysis.reanalyze')}
            </button>
          </div>
        )}

        {aiError && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl p-4 text-xs font-bold flex items-center gap-2">
            <Zap size={14} />
            {aiError}
          </div>
        )}
      </div>
    </section>
  );
};

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

const AnalysisScreen = () => {
  const { t, i18n } = useTranslation();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('전체');
  const [sortBy, setSortBy] = useState('latest');
  const [showAllPRs, setShowAllPRs] = useState(false);
  const [aiTrainingAnalysis, setAiTrainingAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // DB에서 불러온 운동 데이터 상태
  const [exerciseDataset, setExerciseDataset] = useState([]);


  useEffect(() => {
    setShowAllPRs(false);
  }, [selectedMuscleGroup]);

  useEffect(() => {
    if (!aiTrainingAnalysis) return;
    setAiTrainingAnalysis(prev => ({
      ...prev,
      intensity: computedAnalysisStats.intensityVal,
      balance: computedAnalysisStats.balanceVal,
      consistency: computedAnalysisStats.consistencyVal,
    }));
  }, [selectedMuscleGroup]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error(t('common.loginRequired'));

        const { data: { session } } = await supabase.auth.getSession();
        setToken(session?.access_token || null);

        // 운동 로그와 운동 데이터셋을 동시에 병렬로 로드
        const [logsRes, datasetRes] = await Promise.all([
          supabase
            .from('workout_logs')
            .select('id, exercise, part, sets_data, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true }),
          fetchAllExercises() // DB에서 전체 운동 목록 가져오기
        ]);

        if (logsRes.error) throw logsRes.error;
        setLogs(logsRes.data || []);
        setExerciseDataset(datasetRes || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // ── AI 종합 분석 ─────────────────────────────────────────────────────────
  const requestAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const { recentLogs, muscleStats, dayStats, weeklyFrequency, intensityVal, balanceVal, consistencyVal } = computedAnalysisStats;

      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: {
          type: 'training_analysis',
          lang: i18n.language,
          total_workouts: recentLogs.length,
          muscle_stats: muscleStats,
          day_stats: dayStats,
          weekly_frequency: weeklyFrequency,
          period_days: 30,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (error) throw error;
      let parsed = {};
      try { parsed = JSON.parse(data.content); } catch { /* parse 실패 시 빈 객체로 처리 */ }
      setAiTrainingAnalysis({
        ...parsed,
        intensity: intensityVal,
        balance: balanceVal,
        consistency: consistencyVal,
      });
    } catch (err) {
      console.error('AI 분석 실패:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ── 데이터 가공 ──────────────────────────────────────────────────────────
  const prList = useMemo(() => {
    if (!logs.length) return [];

    const prMap = {};
    logs.forEach(log => {
      const exercise = log.exercise;
      if (!exercise) return;
      let setsData = log.sets_data;
      if (typeof setsData === 'string') { try { setsData = JSON.parse(setsData); } catch { return; } }
      if (!Array.isArray(setsData) || !setsData.length) return;

      setsData.forEach(set => {
        const w = parseFloat(set.kg || set.weight || 0);
        const r = parseInt(set.reps || 0);
        if (!w || !r) return;
        const existing = prMap[exercise];
        if (!existing || w > existing.weight || (w === existing.weight && r > existing.reps)) {
          prMap[exercise] = { weight: w, reps: r, sets: setsData.length, date: log.created_at, part: log.part };
        }
      });
    });

    return Object.entries(prMap)
      .map(([exercise, data]) => ({ exercise, ...data, muscleGroup: normalizePart(data.part) }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [logs]);

  const muscleGroupCounts = useMemo(() => {
    const counts = {};
    prList.forEach(pr => { counts[pr.muscleGroup] = (counts[pr.muscleGroup] || 0) + 1; });
    return counts;
  }, [prList]);

  const visibleTabs = useMemo(
    () => MUSCLE_TABS.filter(tab => tab === '전체' || muscleGroupCounts[tab] > 0),
    [muscleGroupCounts]
  );

  const filteredPRs = useMemo(() => {
    let list = selectedMuscleGroup === '전체'
      ? prList
      : prList.filter(pr => pr.muscleGroup === selectedMuscleGroup);

    if (sortBy === 'latest') list = [...list].sort((a, b) => new Date(b.date) - new Date(a.date));
    else if (sortBy === 'weight') list = [...list].sort((a, b) => b.weight - a.weight);
    else if (sortBy === 'name') list = [...list].sort((a, b) => a.exercise.localeCompare(b.exercise, 'ko'));
    return list;
  }, [prList, selectedMuscleGroup, sortBy]);

  const computedAnalysisStats = useMemo(() => {
    const noData = i18n.language === 'en' ? 'No records' : '기록 없음';
    const periodDays = 30;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    let recentLogs = logs.filter(log => new Date(log.created_at) >= thirtyDaysAgo);

    // 특정 부위 필터 적용: exercises 테이블 body_part 기반
    if (selectedMuscleGroup !== '전체') {
      recentLogs = recentLogs.filter(log => {
        const exInfo = exerciseDataset.find(e =>
          e.name?.trim().toLowerCase() === log.exercise?.trim().toLowerCase()
        );
        return normalizePart(exInfo?.bodyPart || exInfo?.body_part || log.part) === selectedMuscleGroup;
      });
    }

    // 훈련 강도: sets_data kg × reps 볼륨 합산
    const totalVolume = recentLogs.reduce((sum, log) => sum + calcLogVolume(log.sets_data), 0);
    const intensityVal = totalVolume > 0
      ? (i18n.language === 'en' ? `Total ${totalVolume.toLocaleString()} kg` : `총 ${totalVolume.toLocaleString()}kg`)
      : noData;

    // 부위 균형: exercises 테이블 body_part 기준 비율
    const muscleStats = {};
    recentLogs.forEach(log => {
      const exInfo = exerciseDataset.find(e =>
        e.name?.trim().toLowerCase() === log.exercise?.trim().toLowerCase()
      );
      const muscle = normalizePart(exInfo?.bodyPart || exInfo?.body_part || log.part);
      if (muscle === '기타') return;
      if (!muscleStats[muscle]) muscleStats[muscle] = { count: 0, volume: 0 };
      muscleStats[muscle].count += 1;
      muscleStats[muscle].volume += calcLogVolume(log.sets_data);
    });
    const partEntries = Object.entries(muscleStats).sort((a, b) => b[1].volume - a[1].volume);
    const balanceVal = partEntries.length > 0
      ? partEntries.map(([p, s]) => `${p} ${Math.round((s.volume / totalVolume) * 100)}%`).join(', ')
      : noData;

    // 일관성: 최근 30일 중 운동한 날 수 비율
    const uniqueDays = new Set(recentLogs.map(l => l.created_at.split('T')[0])).size;
    const consistencyVal = recentLogs.length > 0
      ? (i18n.language === 'en'
          ? `${uniqueDays}/${periodDays} days (${Math.round((uniqueDays / periodDays) * 100)}%)`
          : `${periodDays}일 중 ${uniqueDays}일 (${Math.round((uniqueDays / periodDays) * 100)}%)`)
      : noData;

    const dayNames = i18n.language === 'en'
      ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      : ['일', '월', '화', '수', '목', '금', '토'];
    const dayStats = {};
    recentLogs.forEach(log => {
      const dayName = dayNames[new Date(log.created_at).getDay()];
      dayStats[dayName] = (dayStats[dayName] || 0) + 1;
    });

    return {
      recentLogs, muscleStats, dayStats,
      weeklyFrequency: Math.round(recentLogs.length / 4.3),
      intensityVal, balanceVal, consistencyVal,
    };
  }, [selectedMuscleGroup, logs, exerciseDataset, i18n.language]);

  // ── 렌더 ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 w-full max-w-6xl mx-auto bg-slate-950 min-h-screen pb-24">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">{t('analysis.title')}</h2>
        {!loading && !error && (
          <span className="text-xs font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            {logs.length}{t('analysis.recordsCount')}
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-2xl p-4 text-sm font-bold mb-6">
          {error}
        </div>
      )}

      {loading && (
        <div className="space-y-6">
          <div className="flex gap-2 mb-4">
            {[80, 60, 64, 72, 60, 52, 60].map((w, i) => (
              <Skeleton key={i} className={`h-9 w-${w / 4} flex-shrink-0`} style={{ width: w }} />
            ))}
          </div>
          <Skeleton className="h-48 w-full" />
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      )}

      {!loading && !error && logs.length === 0 && (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
            <Zap size={36} className="text-slate-700" />
          </div>
          <p className="text-white font-black italic text-xl uppercase tracking-tighter">{t('analysis.noData')}</p>
          <p className="text-slate-500 font-bold text-sm">{t('analysis.noDataDesc')}</p>
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="space-y-8">

          {/* ── 부위 탭 (공통) ── */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {visibleTabs.map(tab => {
              const count = tab === '전체' ? prList.length : (muscleGroupCounts[tab] || 0);
              const tabKey = MUSCLE_KEY_MAP[tab] || tab;
              const tabLabel = tab === '전체' ? t('bodyParts.all') : t(`bodyParts.${tabKey}`, { defaultValue: tab });
              const isActive = selectedMuscleGroup === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setSelectedMuscleGroup(tab)}
                  className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200 active:scale-95'
                  }`}
                >
                  {tabLabel}
                  <span className={`ml-1.5 text-[10px] ${isActive ? 'text-blue-200' : 'text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── 전체 탭: 부위별 볼륨 도넛 차트 ── */}
          {selectedMuscleGroup === '전체' && (
            <VolumeDistributionSection logs={logs} />
          )}

          {/* ── 전체 탭: AI 종합 훈련 분석 ── */}
          {selectedMuscleGroup === '전체' && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Brain size={16} className="text-purple-400" />
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('analysis.aiAnalysis')}</h3>
                {!aiTrainingAnalysis && (
                  <button
                    onClick={requestAIAnalysis}
                    disabled={isAnalyzing || !token}
                    className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white disabled:opacity-40 transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                  >
                    {isAnalyzing ? (
                      <><Loader2 size={13} className="animate-spin" />{t('common.processing')}</>
                    ) : (
                      <><Sparkles size={13} />{t('analysis.aiAnalysisRequest')}</>
                    )}
                  </button>
                )}
              </div>

              {!aiTrainingAnalysis && !isAnalyzing && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center bg-slate-900 border border-slate-800 rounded-2xl">
                  <Brain size={36} className="text-slate-700" />
                  <p className="text-white font-black text-sm">{t('analysis.aiPrompt')}</p>
                  <p className="text-slate-500 text-xs font-bold">{t('analysis.aiPromptDesc')}</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="flex items-center justify-center gap-3 py-8 bg-slate-900 border border-slate-800 rounded-2xl">
                  <Loader2 size={18} className="animate-spin text-purple-400" />
                  <span className="text-slate-400 text-xs font-bold">{t('analysis.aiAnalyzingFull')}</span>
                </div>
              )}

              {aiTrainingAnalysis && (
                <div className="space-y-4">
                  {/* 요약 카드 */}
                  <div className="rounded-2xl p-5 border border-blue-500/30" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(139,92,246,0.08))' }}>
                    <div className="text-white font-black text-base mb-2">{aiTrainingAnalysis.title}</div>
                    <p className="text-slate-300 text-xs leading-relaxed">{aiTrainingAnalysis.summary}</p>
                  </div>

                  {/* 인사이트 3칸 */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: <TrendingUp size={15} className="text-blue-400" />, label: t('analysis.trainingIntensity'), value: aiTrainingAnalysis.intensity },
                      { icon: <Target size={15} className="text-green-400" />, label: t('analysis.muscleBalance'), value: aiTrainingAnalysis.balance },
                      { icon: <Calendar size={15} className="text-yellow-400" />, label: t('analysis.consistency'), value: aiTrainingAnalysis.consistency },
                    ].map(({ icon, label, value }) => (
                      <div key={label} className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-col gap-2">
                        {icon}
                        <span className="text-slate-500 text-[10px] font-bold">{label}</span>
                        <span className="text-white font-black text-xs leading-tight">{value}</span>
                      </div>
                    ))}
                  </div>

                  {/* 개선 제안 */}
                  {aiTrainingAnalysis.recommendations?.length > 0 && (
                    <div className="bg-emerald-500/10 border-l-4 border-emerald-500 rounded-r-2xl p-4 space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Lightbulb size={13} className="text-yellow-400" />
                        <span className="text-xs font-black text-emerald-400">{t('analysis.suggestions')}</span>
                      </div>
                      {aiTrainingAnalysis.recommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed">
                          <span className="text-emerald-400 font-black flex-shrink-0">✓</span>
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={requestAIAnalysis}
                    className="text-[10px] font-bold text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {t('analysis.reanalyze')}
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ── 특정 부위 탭 ── */}
          {selectedMuscleGroup !== '전체' && (
            <>
              {/* PR 섹션 */}
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Award size={16} className="text-yellow-400" />
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
                    {t('analysis.personalRecords')}
                  </h3>
                  <div className="ml-auto">
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:border-slate-600 cursor-pointer"
                    >
                      <option value="latest">{t('analysis.sortNewest')}</option>
                      <option value="weight">{t('analysis.sortHeaviest')}</option>
                      <option value="name">{t('analysis.sortName')}</option>
                    </select>
                  </div>
                </div>

                {filteredPRs.length > 0 ? (
                  <>
                    <div className="space-y-2.5">
                      {(showAllPRs ? filteredPRs : filteredPRs.slice(0, 5)).map(pr => (
                        <PRCard key={pr.exercise} pr={pr} dataset={exerciseDataset} />
                      ))}
                    </div>
                    {filteredPRs.length > 5 && (
                      <ShowMoreBtn
                        expanded={showAllPRs}
                        count={filteredPRs.length - 5}
                        onClick={() => setShowAllPRs(v => !v)}
                      />
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 gap-3 text-center bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                      <Trophy size={22} className="text-slate-600" />
                    </div>
                    <p className="text-white font-black text-sm">{t('analysis.noPrData')}</p>
                    <p className="text-slate-500 text-xs font-bold">{t('analysis.noPrDesc')}</p>
                  </div>
                )}
              </section>

              {/* 세부 분포 도넛 차트 + AI 분석 */}
              <MuscleDetailAnalysis
                muscleGroup={selectedMuscleGroup}
                logs={logs}
                token={token}
                dataset={exerciseDataset}
              />
            </>
          )}

        </div>
      )}
    </div>
  );
};

export default AnalysisScreen;
