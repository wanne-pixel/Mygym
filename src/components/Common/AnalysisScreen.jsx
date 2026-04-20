import React, { useState, useEffect, useMemo } from 'react';
import {
  Award, Zap, Trophy, ChevronDown, ChevronUp,
  Loader2, Brain, Lightbulb, Sparkles,
  BarChart3, PieChart as PieChartIcon,
  TrendingUp, Target, Calendar
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import { supabase } from '../../api/supabase';

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

// 운동명 → 서브카테고리 매핑
const SUB_CATEGORY_MAP = {
  // 가슴 - 상부
  '바벨 인클라인 벤치 프레스': '상부', '스미스 인클라인 벤치 프레스': '상부',
  '덤벨 인클라인 벤치 프레스': '상부', '덤벨 인클라인 플라이': '상부',
  '케이블 인클라인 플라이': '상부', '레버 인클라인 가슴 프레스': '상부',
  '인클라인 푸시 업': '상부',
  // 가슴 - 중부
  '바벨 벤치 프레스': '중부', '스미스 벤치 프레스': '중부',
  '덤벨 벤치 프레스': '중부', '덤벨 플라이': '중부', '덤벨 풀오버': '중부',
  '케이블 크로스오버': '중부', '케이블 미들 플라이': '중부',
  '케이블 스탠딩 플라이': '중부', '케이블 시티드 가슴 프레스': '중부',
  '레버 가슴 프레스': '중부', '레버 시티드 플라이': '중부', '푸시 업': '중부',
  // 가슴 - 하부
  '디클라인 푸시 업': '하부', '어시스트 딥스': '하부', '가슴 딥스': '하부',
  // 등 - 넓이
  '케이블 풀다운 / 랫풀다운': '넓이', '언더핸드 풀다운': '넓이',
  '패러럴 그립 랫 풀다운': '넓이', '케이블 원암 풀다운': '넓이',
  '레버 프론트 풀다운': '넓이', '풀업': '넓이', '친업': '넓이',
  '뉴트럴 그립 풀업': '넓이', '와이드 그립 풀업': '넓이',
  '스캐풀라 풀업': '넓이', '어시스트 풀업': '넓이',
  // 등 - 두께
  '바벨 벤트오버 로우': '두께', '바벨 펜들레이 로우': '두께',
  '바벨 리버스 그립 벤트오버 로우': '두께', '스미스 벤트오버 로우': '두께',
  '덤벨 벤트오버 로우': '두께', '덤벨 원암 벤트오버 로우': '두께',
  '덤벨 인클라인 로우': '두께', '케이블 시티드 로우': '두께',
  '케이블 시티드 와이드 그립 로우': '두께', '케이블 V바 하이 로우': '두께',
  '케이블 원암 로우': '두께', '레버 하이 로우': '두께',
  '레버 시티드 로우': '두께', '레버 T바 로우': '두께',
  '인버티드 로우': '두께', '서스펜디드 로우': '두께',
  // 등 - 승모근
  '바벨 슈러그': '승모근', '덤벨 슈러그': '승모근',
  // 등 - 기타
  '케이블 스트레이트 암 풀다운': '기타', '하이퍼익스텐션': '기타',
  // 어깨 - 전면
  '바벨 시티드 오버헤드 프레스': '전면', '바벨 프론트 레이즈': '전면',
  '스미스 시티드 숄더 프레스': '전면', '스미스 숄더 프레스': '전면',
  '덤벨 아놀드 프레스': '전면', '덤벨 시티드 숄더 프레스': '전면',
  '덤벨 스탠딩 오버헤드 프레스': '전면', '덤벨 프론트 레이즈': '전면',
  '케이블 숄더 프레스': '전면', '레버 숄더 프레스': '전면',
  // 어깨 - 측면
  '덤벨 레터럴 레이즈': '측면', '덤벨 원암 레터럴 레이즈': '측면',
  '케이블 레터럴 레이즈': '측면', '케이블 원암 레터럴 레이즈': '측면',
  '레버 레터럴 레이즈': '측면', '바벨 업라이트 로우': '측면',
  '스미스 업라이트 로우': '측면',
  // 어깨 - 후면
  '덤벨 리버스 플라이': '후면', '덤벨 리어 레터럴 레이즈': '후면',
  '케이블 외회전': '후면', '케이블 리어 델트 로우': '후면',
  '레버 시티드 리버스 플라이': '후면',
  // 하체 - 대퇴사두근
  '바벨 스쿼트': '대퇴사두근', '바벨 하이바 스쿼트': '대퇴사두근',
  '바벨 로우바 스쿼트': '대퇴사두근', '바벨 프론트 스쿼트': '대퇴사두근',
  '스미스 스쿼트': '대퇴사두근', '스미스 핵 스쿼트': '대퇴사두근',
  '덤벨 스쿼트': '대퇴사두근', '덤벨 고블릿 스쿼트': '대퇴사두근',
  '레그 프레스': '대퇴사두근', '레그 익스텐션': '대퇴사두근',
  '45도 레그 프레스': '대퇴사두근', '핵 스쿼트': '대퇴사두근',
  '바벨 런지': '대퇴사두근', '바벨 리버스 런지': '대퇴사두근',
  '바벨 스텝업': '대퇴사두근', '스미스 불가리안/스플릿 스쿼트': '대퇴사두근',
  '덤벨 런지': '대퇴사두근', '덤벨 리버스 런지': '대퇴사두근',
  '덤벨 스텝업': '대퇴사두근', '포워드 런지': '대퇴사두근',
  '스플릿 스쿼트': '대퇴사두근', '워킹 런지': '대퇴사두근',
  '점프 스쿼트': '대퇴사두근',
  // 하체 - 햄스트링/둔근
  '바벨 데드리프트': '햄스트링/둔근', '바벨 루마니안 데드리프트': '햄스트링/둔근',
  '바벨 스모 데드리프트': '햄스트링/둔근', '바벨 랙풀': '햄스트링/둔근',
  '스미스 데드리프트': '햄스트링/둔근', '덤벨 데드리프트': '햄스트링/둔근',
  '덤벨 루마니안 데드리프트': '햄스트링/둔근',
  '덤벨 싱글 레그 데드리프트': '햄스트링/둔근',
  '트랩바 데드리프트': '햄스트링/둔근', '라이잉 레그 컬': '햄스트링/둔근',
  '시티드 레그 컬': '햄스트링/둔근', '바벨 글루트 브리지': '햄스트링/둔근',
  '글루트 브리지 (벤치)': '햄스트링/둔근', '케이블 힙 익스텐션': '햄스트링/둔근',
  '케이블 풀 스루': '햄스트링/둔근', '힙 어브덕션': '햄스트링/둔근',
  '힙 어덕션': '햄스트링/둔근', '케이블 힙 어덕션': '햄스트링/둔근',
  // 하체 - 종아리
  '바벨 스탠딩 카프 레이즈': '종아리', '바벨 시티드 카프 레이즈': '종아리',
  '덤벨 시티드 카프 레이즈': '종아리', '덤벨 스탠딩 카프 레이즈': '종아리',
  '시티드 카프 레이즈': '종아리', '스탠딩 카프 레이즈': '종아리',
  '레그프레스 카프 레이즈': '종아리', '맨몸 스탠딩 카프 레이즈': '종아리',
  '파머스 워크': '종아리',
  // 팔 - 이두근
  '바벨 컬': '이두근', '바벨 프리처 컬': '이두근', '바벨 리버스 컬': '이두근',
  'EZ바 컬': '이두근', 'EZ바 리버스 컬': '이두근', 'EZ바 프리처 컬': '이두근',
  '덤벨 이두 컬': '이두근', '덤벨 얼터네이트 컬': '이두근',
  '덤벨 해머 컬': '이두근', '덤벨 인클라인 컬': '이두근',
  '덤벨 컨센트레이션 컬': '이두근', '덤벨 프리처 컬': '이두근',
  '덤벨 조트만 컬': '이두근', '케이블 컬': '이두근',
  '케이블 원암 컬': '이두근', '케이블 해머 컬': '이두근',
  '케이블 프리처 컬': '이두근', '케이블 리버스 컬': '이두근',
  '머신 바이셉 컬': '이두근', '머신 프리처 컬': '이두근',
  // 팔 - 삼두근
  '바벨 클로즈 그립 벤치 프레스': '삼두근',
  '바벨 라이잉 트라이셉스 익스텐션': '삼두근', '바벨 스컬 크러셔': '삼두근',
  '바벨 시티드 오버헤드 트라이셉스 익스텐션': '삼두근',
  'EZ바 시티드 트라이셉스 익스텐션': '삼두근',
  '스미스 클로즈 그립 벤치 프레스': '삼두근',
  '덤벨 라이잉 트라이셉스 익스텐션': '삼두근',
  '덤벨 원암 트라이셉스 익스텐션': '삼두근',
  '덤벨 시티드 트라이셉스 익스텐션': '삼두근', '덤벨 킥백': '삼두근',
  '케이블 푸시다운': '삼두근', '케이블 로프 푸시다운': '삼두근',
  '케이블 V바 트라이셉스 푸시다운': '삼두근',
  '케이블 오버헤드 트라이셉스 익스텐션': '삼두근',
  '케이블 원암 트라이셉스 푸시다운': '삼두근',
  '머신 트라이셉스 익스텐션': '삼두근', '시티드 딥 머신': '삼두근',
  '삼두 딥스': '삼두근', '벤치 딥스': '삼두근',
  '클로즈 그립 푸시업': '삼두근', '다이아몬드 푸시업': '삼두근',
  // 팔 - 전완근
  '바벨 리스트 컬': '전완근', '바벨 리버스 리스트 컬': '전완근',
  // 코어 - 복직근
  '크런치': '복직근', '리버스 크런치': '복직근', '싯업': '복직근',
  '잭나이프 싯업': '복직근', '행잉 레그 레이즈': '복직근',
  '라이잉 레그 레이즈': '복직근', '데드 버그': '복직근',
  '에어 바이크/바이시클 크런치': '복직근', '케이블 니링 크런치': '복직근',
  '케이블 스탠딩 크런치': '복직근', '중량 크런치': '복직근',
  '중량 행잉 레그 레이즈': '복직근', '어시스트 행잉 니 레이즈': '복직근',
  '어시스트 싯업': '복직근', '플랭크 변형': '복직근', '중량 플랭크': '복직근',
  // 코어 - 복사근/회전
  '크로스 바디 크런치': '복사근/회전', '러시안 트위스트': '복사근/회전',
  '사이드 플랭크': '복사근/회전', '행잉 오블리크 니 레이즈': '복사근/회전',
  '힐 터치': '복사근/회전', '케이블 트위스트': '복사근/회전',
  '케이블 사이드 벤드': '복사근/회전', '덤벨 사이드 벤드': '복사근/회전',
  '중량 러시안 트위스트': '복사근/회전', '바벨 롤아웃': '복사근/회전',
  '랜드마인 180': '복사근/회전',
};

const SUB_CAT_COLORS = {
  '상부': '#60a5fa', '중부': '#3b82f6', '하부': '#2563eb',
  '넓이': '#a78bfa', '두께': '#7c3aed', '승모근': '#6d28d9',
  '전면': '#f472b6', '측면': '#ec4899', '후면': '#db2777',
  '대퇴사두근': '#fb923c', '햄스트링/둔근': '#f59e0b', '종아리': '#ea580c',
  '이두근': '#34d399', '삼두근': '#10b981', '전완근': '#059669',
  '복직근': '#22d3ee', '복사근/회전': '#06b6d4',
  '기타': '#94a3b8',
};

// ─── 헬퍼 함수 ───────────────────────────────────────────────────────────────

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

const getSubCategory = (name) => SUB_CATEGORY_MAP[name] || '기타';

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

const PRCard = ({ pr }) => {
  const days = daysSince(pr.date);
  const isNew = days <= 7;
  const isRecent = days <= 30;
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
        <div className="flex items-center gap-2">
          <span className="text-white font-black text-sm truncate">{pr.exercise}</span>
          {isNew && (
            <span className="text-[9px] font-black text-blue-400 bg-blue-400/15 px-2 py-0.5 rounded-full uppercase tracking-widest flex-shrink-0">NEW</span>
          )}
          {!isNew && isRecent && (
            <span className="text-[9px] font-black text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-full uppercase tracking-widest flex-shrink-0">30일</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-blue-400 font-black text-base">{pr.weight}kg</span>
          <span className="text-slate-500 text-xs font-bold">× {pr.reps}회</span>
          {pr.sets > 1 && <span className="text-slate-600 text-xs">/ {pr.sets}세트</span>}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-slate-500 text-xs font-bold">{formatDateFull(pr.date)}</div>
        <div className="text-slate-600 text-[11px] mt-0.5">1RM ≈ {calc1RM(pr.weight, pr.reps)}kg</div>
      </div>
    </div>
  );
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-800 rounded-xl ${className}`} />
);

// ─── 더보기 버튼 ──────────────────────────────────────────────────────────────

const ShowMoreBtn = ({ expanded, count, onClick }) => (
  <button
    onClick={onClick}
    className="mt-3 w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-slate-900 border border-slate-800 text-blue-400 text-xs font-black hover:bg-slate-800 transition-all active:scale-95"
  >
    {expanded ? <><ChevronUp size={15} />접기</> : <><ChevronDown size={15} />더보기 ({count}개)</>}
  </button>
);

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
      .filter(t => t !== '전체' && volMap[t] > 0)
      .map(tab => ({
        name: tab,
        value: Math.round(volMap[tab]),
        percentage: Math.round((volMap[tab] / total) * 100),
      }))
      .sort((a, b) => b.value - a.value);
  }, [logs]);

  if (!data.length) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-5">
        <BarChart3 size={16} className="text-blue-400" />
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">부위별 볼륨 분포</h3>
        <span className="text-[10px] font-bold text-slate-600 ml-auto">전체 기간</span>
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
              label={({ name, percentage }) => `${name} ${percentage}%`}
              labelLine={true}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={MUSCLE_COLORS[entry.name] || '#94a3b8'} />
              ))}
            </Pie>
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
        <DonutLegend items={data} colorMap={MUSCLE_COLORS} />
      </div>
      <p className="text-slate-600 text-[11px] mt-3 text-center font-bold">
        전체 운동 {logs.length}개 기록 기준
      </p>
    </section>
  );
};

// ─── 서브카테고리 분석 + AI 인사이트 ─────────────────────────────────────────

const MuscleDetailAnalysis = ({ muscleGroup, logs, token }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiError, setAiError] = useState(null);

  useEffect(() => {
    setAiAnalysis(null);
    setAiError(null);
  }, [muscleGroup]);

  const subCategoryData = useMemo(() => {
    const filtered = logs.filter(log => normalizePart(log.part) === muscleGroup);
    const volMap = {};
    const cntMap = {};

    filtered.forEach(log => {
      const sub = getSubCategory(log.exercise);
      const vol = calcLogVolume(log.sets_data);
      volMap[sub] = (volMap[sub] || 0) + vol;
      cntMap[sub] = (cntMap[sub] || 0) + 1;
    });

    const total = Object.values(volMap).reduce((s, v) => s + v, 0);
    if (total === 0) return [];

    return Object.entries(volMap)
      .map(([cat, vol]) => ({
        name: cat,
        value: Math.round(vol),
        count: cntMap[cat],
        percentage: Math.round((vol / total) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage);
  }, [muscleGroup, logs]);

  const runAnalysis = async () => {
    if (!subCategoryData.length || !token) return;
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: {
          type: 'muscle_analysis',
          muscle_group: muscleGroup,
          breakdown: subCategoryData,
          total_exercises: subCategoryData.reduce((s, d) => s + d.count, 0),
        },
        headers: { Authorization: `Bearer ${token}` },
      });
      if (error) throw error;
      const parsed = JSON.parse(data.content);
      setAiAnalysis(parsed.analysis || parsed);
    } catch (err) {
      setAiError('AI 분석에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!subCategoryData.length) return null;

  return (
    <section>
      {/* 서브카테고리 도넛 차트 */}
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon size={16} className="text-blue-400" />
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
          {muscleGroup} 세부 분포
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
              label={({ name, percentage }) => `${name} ${percentage}%`}
              labelLine={true}
            >
              {subCategoryData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={SUB_CAT_COLORS[entry.name] || '#94a3b8'} />
              ))}
            </Pie>
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
        <DonutLegend items={subCategoryData} colorMap={SUB_CAT_COLORS} />
      </div>

      {/* AI 분석 */}
      <div className="mt-4">
        {!aiAnalysis && !isAnalyzing && (
          <button
            onClick={runAnalysis}
            disabled={!token}
            className="w-full flex items-center justify-center gap-2 py-4 bg-purple-600/15 border border-purple-500/30 text-purple-400 text-xs font-black rounded-2xl hover:bg-purple-600/25 transition-all active:scale-95 disabled:opacity-40"
          >
            <Brain size={15} />
            AI 훈련 분석 요청
          </button>
        )}

        {isAnalyzing && (
          <div className="flex items-center justify-center gap-3 py-6 bg-slate-900 border border-slate-800 rounded-2xl">
            <Loader2 size={18} className="animate-spin text-purple-400" />
            <span className="text-slate-400 text-xs font-bold">AI가 훈련 패턴을 분석 중...</span>
          </div>
        )}

        {aiAnalysis && (
          <div className="bg-purple-500/10 border border-purple-500/25 rounded-2xl p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                <Brain size={15} className="text-purple-400" />
              </div>
              <div>
                <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest">AI 인사이트</div>
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
              다시 분석
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
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('전체');
  const [sortBy, setSortBy] = useState('latest');
  const [showAllPRs, setShowAllPRs] = useState(false);
  const [aiTrainingAnalysis, setAiTrainingAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);


  useEffect(() => {
    setShowAllPRs(false);
  }, [selectedMuscleGroup]);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('로그인이 필요합니다.');

        const { data: { session } } = await supabase.auth.getSession();
        setToken(session?.access_token || null);

        const { data, error: dbError } = await supabase
          .from('workout_logs')
          .select('id, exercise, part, sets_data, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (dbError) throw dbError;
        setLogs(data || []);
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
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentLogs = logs.filter(log =>
        new Date(log.created_at) >= thirtyDaysAgo
      );

      const muscleStats = {};
      recentLogs.forEach(log => {
        const muscle = normalizePart(log.part);
        if (muscle === '기타') return;
        if (!muscleStats[muscle]) muscleStats[muscle] = { count: 0, volume: 0 };
        muscleStats[muscle].count += 1;
        muscleStats[muscle].volume += calcLogVolume(log.sets_data);
      });

      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const dayStats = {};
      recentLogs.forEach(log => {
        const dayName = dayNames[new Date(log.created_at).getDay()];
        dayStats[dayName] = (dayStats[dayName] || 0) + 1;
      });

      const weeklyFrequency = Math.round(recentLogs.length / 4.3);

      const { data, error } = await supabase.functions.invoke('ai-coach', {
        body: {
          type: 'training_analysis',
          total_workouts: recentLogs.length,
          muscle_stats: muscleStats,
          day_stats: dayStats,
          weekly_frequency: weeklyFrequency,
          period_days: 30,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (error) throw error;
      const parsed = JSON.parse(data.content);
      setAiTrainingAnalysis(parsed);
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

  // ── 렌더 ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 bg-slate-950 min-h-screen pb-24">
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter">분석</h2>
        {!loading && !error && (
          <span className="text-xs font-bold text-slate-500 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
            {logs.length}개 기록
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
          <p className="text-white font-black italic text-xl uppercase tracking-tighter">아직 운동 기록이 없어요</p>
          <p className="text-slate-500 font-bold text-sm">운동을 기록하면 분석 결과가 여기에 표시됩니다</p>
        </div>
      )}

      {!loading && !error && logs.length > 0 && (
        <div className="space-y-8">

          {/* ── 부위 탭 (공통) ── */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {visibleTabs.map(tab => {
              const count = tab === '전체' ? prList.length : (muscleGroupCounts[tab] || 0);
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
                  {tab}
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
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">AI 훈련 분석</h3>
                {!aiTrainingAnalysis && (
                  <button
                    onClick={requestAIAnalysis}
                    disabled={isAnalyzing || !token}
                    className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white disabled:opacity-40 transition-all active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
                  >
                    {isAnalyzing ? (
                      <><Loader2 size={13} className="animate-spin" />분석 중...</>
                    ) : (
                      <><Sparkles size={13} />분석 요청</>
                    )}
                  </button>
                )}
              </div>

              {!aiTrainingAnalysis && !isAnalyzing && (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center bg-slate-900 border border-slate-800 rounded-2xl">
                  <Brain size={36} className="text-slate-700" />
                  <p className="text-white font-black text-sm">AI가 최근 30일 훈련 패턴을 분석해드립니다</p>
                  <p className="text-slate-500 text-xs font-bold">운동 빈도, 부위 균형, 개선점 등을 확인하세요</p>
                </div>
              )}

              {isAnalyzing && (
                <div className="flex items-center justify-center gap-3 py-8 bg-slate-900 border border-slate-800 rounded-2xl">
                  <Loader2 size={18} className="animate-spin text-purple-400" />
                  <span className="text-slate-400 text-xs font-bold">AI가 훈련 데이터를 분석 중...</span>
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
                      { icon: <TrendingUp size={15} className="text-blue-400" />, label: '훈련 강도', value: aiTrainingAnalysis.intensity },
                      { icon: <Target size={15} className="text-green-400" />, label: '부위 균형', value: aiTrainingAnalysis.balance },
                      { icon: <Calendar size={15} className="text-yellow-400" />, label: '일관성', value: aiTrainingAnalysis.consistency },
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
                        <span className="text-xs font-black text-emerald-400">개선 제안</span>
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
                    다시 분석
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
                    개인 최고 기록 (PR)
                  </h3>
                  <div className="ml-auto">
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      className="bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:border-slate-600 cursor-pointer"
                    >
                      <option value="latest">최신순</option>
                      <option value="weight">중량 높은순</option>
                      <option value="name">이름순</option>
                    </select>
                  </div>
                </div>

                {filteredPRs.length > 0 ? (
                  <>
                    <div className="space-y-2.5">
                      {(showAllPRs ? filteredPRs : filteredPRs.slice(0, 5)).map(pr => (
                        <PRCard key={pr.exercise} pr={pr} />
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
                    <p className="text-white font-black text-sm">아직 {selectedMuscleGroup} 운동 기록이 없어요</p>
                    <p className="text-slate-500 text-xs font-bold">{selectedMuscleGroup} 운동을 시작하면 여기에 PR이 표시됩니다</p>
                  </div>
                )}
              </section>

              {/* 세부 분포 도넛 차트 + AI 분석 */}
              <MuscleDetailAnalysis
                muscleGroup={selectedMuscleGroup}
                logs={logs}
                token={token}
              />
            </>
          )}

        </div>
      )}
    </div>
  );
};

export default AnalysisScreen;
