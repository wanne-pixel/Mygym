import React, { useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const mockRadarByCategory = {
    '전체': [
        { subject: '가슴', 목표: 120, 현재: 80, fullMark: 150 },
        { subject: '등', 목표: 120, 현재: 110, fullMark: 150 },
        { subject: '하체', 목표: 150, 현재: 90, fullMark: 150 },
        { subject: '어깨', 목표: 100, 현재: 105, fullMark: 150 },
        { subject: '팔', 목표: 80, 현재: 85, fullMark: 150 },
    ],
    '가슴': [
        { subject: '윗가슴', 목표: 40, 현재: 30, fullMark: 60 },
        { subject: '중간가슴', 목표: 50, 현재: 35, fullMark: 60 },
        { subject: '아랫가슴', 목표: 30, 현재: 15, fullMark: 60 },
        { subject: '안쪽가슴', 목표: 20, 현재: 10, fullMark: 60 },
    ],
    '등': [
        { subject: '광배근 상부', 목표: 40, 현재: 35, fullMark: 60 },
        { subject: '광배근 하부', 목표: 30, 현재: 25, fullMark: 60 },
        { subject: '승모근', 목표: 30, 현재: 40, fullMark: 60 },
        { subject: '기립근', 목표: 20, 현재: 10, fullMark: 60 },
    ],
    '하체': [
        { subject: '대퇴사두', 목표: 60, 현재: 40, fullMark: 80 },
        { subject: '대퇴이두', 목표: 40, 현재: 20, fullMark: 80 },
        { subject: '둔근', 목표: 30, 현재: 25, fullMark: 80 },
        { subject: '종아리', 목표: 20, 현재: 5, fullMark: 80 },
    ],
    '어깨': [
        { subject: '전면 삼각근', 목표: 40, 현재: 45, fullMark: 60 },
        { subject: '측면 삼각근', 목표: 40, 현재: 50, fullMark: 60 },
        { subject: '후면 삼각근', 목표: 20, 현재: 10, fullMark: 60 },
    ],
    '팔': [
        { subject: '이두 단두', 목표: 20, 현재: 15, fullMark: 40 },
        { subject: '이두 장두', 목표: 20, 현재: 25, fullMark: 40 },
        { subject: '삼두 외측', 목표: 20, 현재: 20, fullMark: 40 },
        { subject: '삼두 장두', 목표: 20, 현재: 25, fullMark: 40 },
    ],
    '유산소': [
        { subject: '러닝 (거리)', 목표: 20, 현재: 10, fullMark: 30 },
        { subject: '러닝 (시간)', 목표: 100, 현재: 60, fullMark: 120 },
        { subject: '사이클 (거리)', 목표: 15, 현재: 15, fullMark: 30 },
        { subject: '사이클 (시간)', 목표: 60, 현재: 40, fullMark: 120 },
    ],
};

const VolumeRadarChart = ({ category = '전체' }) => {
    const data = useMemo(() => mockRadarByCategory[category] || mockRadarByCategory['전체'], [category]);
    
    // Calculate dynamic domain based on the fullMark of the first item
    const domainMax = data.length > 0 ? data[0].fullMark : 150;

    return (
        <div className="bg-slate-900/50 border border-slate-700/50 rounded-3xl p-6 transition-all duration-300">
            <div className="mb-4">
                <h3 className="text-xl font-bold text-white mb-1">부위별 볼륨 밸런스 ({category})</h3>
                <p className="text-slate-400 text-sm">현재 훈련량 밸런스 (단위: 세트/분)</p>
            </div>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                        <PolarGrid stroke="#334155" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} />
                        <PolarRadiusAxis angle={30} domain={[0, domainMax]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px' }}
                            itemStyle={{ fontWeight: 'bold' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Radar name="현재 훈련 볼륨" dataKey="현재" stroke="#3b82f6" strokeWidth={2} fill="#3b82f6" fillOpacity={0.6} />
                    </RadarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default VolumeRadarChart;
