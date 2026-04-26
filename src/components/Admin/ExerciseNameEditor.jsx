import { toast } from 'sonner';
import React, { useState, useMemo, useEffect } from 'react';
import { fetchAllExercises } from '../../api/exerciseApi';

const DELETE_KEYWORD = '삭제';

export default function ExerciseNameEditor() {
    const [exercises, setExercises] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterMode, setFilterMode] = useState('all'); // all | modified | deleted

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await fetchAllExercises();
                // 초기 로드 시 가슴 운동만 필터링하거나 전체를 보여줄 수 있음. 
                // 기존 로직이 가슴 운동 중심이었으므로 호환성을 위해 유지
                const chestOnly = data.filter(ex => ex.bodyPart === '가슴');
                setExercises(chestOnly.map(ex => ({ ...ex, modifiedName: ex.name })));
            } catch (error) {
                toast.error('운동 데이터를 불러오는데 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const stats = useMemo(() => {
        const modified = exercises.filter(
            ex => ex.modifiedName !== ex.name && ex.modifiedName !== DELETE_KEYWORD
        ).length;
        const deleted = exercises.filter(ex => ex.modifiedName === DELETE_KEYWORD).length;
        return { total: exercises.length, modified, deleted };
    }, [exercises]);

    const displayed = useMemo(() => {
        let list = exercises;
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(
                ex => ex.name.toLowerCase().includes(q) || ex.modifiedName.toLowerCase().includes(q)
            );
        }
        if (filterMode === 'modified') list = list.filter(ex => ex.modifiedName !== ex.name && ex.modifiedName !== DELETE_KEYWORD);
        if (filterMode === 'deleted') list = list.filter(ex => ex.modifiedName === DELETE_KEYWORD);
        return list;
    }, [exercises, search, filterMode]);

    const updateName = (id, value) => {
        setExercises(prev => prev.map(ex => ex.id === id ? { ...ex, modifiedName: value } : ex));
    };

    const handleReset = () => {
        if (!window.confirm('모든 수정사항을 초기화할까요?')) return;
        setExercises(prev => prev.map(ex => ({ ...ex, modifiedName: ex.name })));
    };

    const handleDownload = () => {
        const finalExercises = exercises
            .filter(ex => ex.modifiedName !== DELETE_KEYWORD)
            .map(({ modifiedName, ...ex }) => ({ ...ex, name: modifiedName }));

        const blob = new Blob([JSON.stringify(finalExercises, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'chest_exercises_modified.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleMarkAllAbnormal = () => {
        // 영문 대문자 또는 한글이 아닌 문자가 포함된 항목 하이라이트용 — 수정본에 기존 이름 유지하되 검색으로 필터링
        setSearch('');
        setFilterMode('all');
        // 특수 케이스: 영문 포함 항목을 찾아서 input에 포커스하기 어려우니, 검색창에 패턴 힌트 제공
        const abnormal = exercises.filter(ex => /[A-Z]/.test(ex.name));
        if (abnormal.length === 0) {
            toast('대문자 영문이 포함된 항목이 없습니다.');
        } else {
            toast(`대문자 영문 포함 항목: ${abnormal.length}개\n\n예: ${abnormal.slice(0, 5).map(e => e.name).join(', ')}...\n\n검색창에 영문을 입력하면 필터링됩니다.`);
        }
    };

    const rowClass = (ex) => {
        if (ex.modifiedName === DELETE_KEYWORD) return 'bg-slate-800/80 opacity-50';
        if (ex.modifiedName !== ex.name) return 'bg-yellow-500/10';
        return 'hover:bg-slate-800/40';
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-1">운동 이름 편집기</h1>
                <p className="text-xs text-slate-500">가슴 운동 이름을 수정하거나 삭제 예정으로 표시하세요</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-black text-white">{stats.total}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">전체</p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-black text-yellow-400">{stats.modified}</p>
                    <p className="text-[10px] text-yellow-600 uppercase tracking-widest mt-0.5">수정됨</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-black text-red-400">{stats.deleted}</p>
                    <p className="text-[10px] text-red-600 uppercase tracking-widest mt-0.5">삭제 예정</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="운동 이름 검색..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2">
                    {[['all', '전체'], ['modified', '수정됨'], ['deleted', '삭제 예정']].map(([val, label]) => (
                        <button
                            key={val}
                            onClick={() => setFilterMode(val)}
                            className={`px-3 py-2 rounded-xl text-xs font-black transition-all ${filterMode === val ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
                <button
                    onClick={handleMarkAllAbnormal}
                    className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-black transition-all border border-slate-700"
                >
                    이상한 이름 찾기
                </button>
                <button
                    onClick={handleReset}
                    className="px-4 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-black transition-all border border-slate-700"
                >
                    전체 초기화
                </button>
                <button
                    onClick={handleDownload}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-blue-900/30 ml-auto"
                >
                    수정된 JSON 다운로드 ({stats.total - stats.deleted}개)
                </button>
            </div>

            {/* Hint */}
            <p className="text-[10px] text-slate-600 mb-3 px-1">
                수정본에 <span className="text-red-400 font-bold">삭제</span> 입력 시 해당 운동이 다운로드에서 제외됩니다.
            </p>

            {/* Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-[3rem_1fr_1fr_6rem] gap-0 text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 py-3 border-b border-slate-800">
                    <span>ID</span>
                    <span>현재 이름</span>
                    <span>수정본</span>
                    <span className="text-center">장비</span>
                </div>

                {/* Rows */}
                <div className="divide-y divide-slate-800/50">
                    {displayed.length === 0 && (
                        <p className="text-center py-12 text-slate-600 text-sm italic">검색 결과가 없습니다.</p>
                    )}
                    {displayed.map(ex => {
                        const isDeleted = ex.modifiedName === DELETE_KEYWORD;
                        const isModified = ex.modifiedName !== ex.name && !isDeleted;
                        return (
                            <div
                                key={ex.id}
                                className={`grid grid-cols-[3rem_1fr_1fr_6rem] gap-0 items-center px-4 py-2.5 transition-colors ${rowClass(ex)}`}
                            >
                                <span className="text-[10px] text-slate-600 font-mono">{ex.id}</span>
                                <span className={`text-xs pr-3 ${isDeleted ? 'line-through text-slate-600' : 'text-slate-300'}`}>
                                    {ex.name}
                                </span>
                                <input
                                    type="text"
                                    value={ex.modifiedName}
                                    onChange={e => updateName(ex.id, e.target.value)}
                                    className={`text-xs rounded-lg px-2 py-1.5 mr-3 focus:outline-none focus:ring-1 transition-all ${
                                        isDeleted
                                            ? 'bg-red-900/30 border border-red-500/30 text-red-400 focus:ring-red-500'
                                            : isModified
                                            ? 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 focus:ring-yellow-500'
                                            : 'bg-slate-800 border border-slate-700 text-white focus:ring-blue-500'
                                    }`}
                                />
                                <span className="text-[9px] text-slate-600 text-center truncate">{ex.equipment}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <p className="text-center text-[10px] text-slate-700 mt-6">
                {displayed.length}/{exercises.length}개 표시
            </p>
        </div>
    );
}
