const { useState, useEffect } = React;

const exerciseData = {
    '가슴': {
        '프리웨이트': ['벤치프레스', '인클라인 벤치프레스', '덤벨 프레스', '덤벨 플라이'],
        '머신': ['체스트 프레스', '팩 덱 플라이', '머신 인클라인 프레스'],
        '케이블': ['케이블 크로스오버'],
    },
    '등': {
        '프리웨이트': ['데드리프트', '바벨 로우', '덤벨 로우', '풀업'],
        '머신': ['렛풀다운', '시티드 로우', '머신 로우'],
        '케이블': ['케이블 로우', '암 풀 다운'],
    },
    '하체': {
        '프리웨이트': ['스쿼트', '런지', '덤벨 스플릿 스쿼트'],
        '머신': ['레그 프레스', '레그 익스텐션', '레그 컬', '헥 스쿼트'],
    },
    '어깨': {
        '프리웨이트': ['오버헤드 프레스', '사이드 레터럴 레이즈', '덤벨 숄더 프레스'],
        '머신': ['머신 숄더 프레스', '머신 레터럴 레이즈'],
    },
    '팔': {
        '프리웨이트': ['바벨 컬', '덤벨 컬', '라잉 트라이셉스 익스텐션'],
        '머신': ['케이블 컬', '푸쉬 다운'],
    }
};

const App = () => {
    const [selectedBodyPart, setSelectedBodyPart] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [selectedExercise, setSelectedExercise] = useState('');
    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');
    const [sets, setSets] = useState([]);

    const bodyParts = Object.keys(exerciseData);
    const types = selectedBodyPart ? Object.keys(exerciseData[selectedBodyPart]) : [];
    const exercises = (selectedBodyPart && selectedType) ? exerciseData[selectedBodyPart][selectedType] : [];

    const handleAddSet = (e) => {
        e.preventDefault();
        if (!selectedExercise || !weight || !reps) return;

        const newSet = {
            id: Date.now(),
            exercise: selectedExercise,
            bodyPart: selectedBodyPart,
            weight: weight,
            reps: reps,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setSets([newSet, ...sets]);
        setWeight('');
        setReps('');
    };

    const handleDeleteSet = (id) => {
        setSets(sets.filter(set => set.id !== id));
    };

    return (
        <div className="max-w-md mx-auto min-h-screen pb-10">
            {/* Header */}
            <header className="bg-indigo-600 text-white p-6 shadow-lg rounded-b-3xl mb-6">
                <h1 className="text-3xl font-bold">MyGym</h1>
                <p className="text-indigo-100 text-sm opacity-80">오늘의 성장을 기록하세요</p>
            </header>

            <div className="px-4 space-y-6">
                {/* Input Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <form onSubmit={handleAddSet} className="space-y-4">
                        {/* 1. 운동 부위 */}
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">운동 부위</label>
                            <div className="grid grid-cols-3 gap-2">
                                {bodyParts.map(part => (
                                    <button
                                        key={part}
                                        type="button"
                                        onClick={() => {
                                            setSelectedBodyPart(part);
                                            setSelectedType('');
                                            setSelectedExercise('');
                                        }}
                                        className={`py-2 text-sm rounded-xl transition-all ${
                                            selectedBodyPart === part 
                                            ? 'bg-indigo-600 text-white shadow-md' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {part}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 2. 종류 (부위 선택 시 표시) */}
                        {selectedBodyPart && (
                            <div className="animate-fade-in">
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">운동 종류</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                    {types.map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => {
                                                setSelectedType(type);
                                                setSelectedExercise('');
                                            }}
                                            className={`px-4 py-2 text-sm whitespace-nowrap rounded-full transition-all border ${
                                                selectedType === type 
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold' 
                                                : 'border-gray-200 text-gray-500'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 3. 기구명 (종류 선택 시 표시) */}
                        {selectedType && (
                            <div className="animate-fade-in">
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">기구명</label>
                                <select 
                                    value={selectedExercise}
                                    onChange={(e) => setSelectedExercise(e.target.value)}
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                >
                                    <option value="">운동을 선택하세요</option>
                                    {exercises.map(ex => (
                                        <option key={ex} value={ex}>{ex}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* 4. 무게 & 횟수 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">무게 (kg)</label>
                                <input
                                    type="number"
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    placeholder="0"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-lg font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">횟수 (회)</label>
                                <input
                                    type="number"
                                    value={reps}
                                    onChange={(e) => setReps(e.target.value)}
                                    placeholder="0"
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-center text-lg font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!selectedExercise || !weight || !reps}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg active:scale-95 ${
                                !selectedExercise || !weight || !reps
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-indigo-600 text-white hover:bg-indigo-700'
                            }`}
                        >
                            세트 추가하기
                        </button>
                    </form>
                </div>

                {/* List Section */}
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                        오늘의 기록 ({sets.length})
                    </h2>
                    
                    {sets.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200 text-gray-400">
                            기록된 세트가 없습니다.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sets.map((set, index) => (
                                <div key={set.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center group animate-slide-up">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-bold text-sm">
                                            {sets.length - index}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800">{set.exercise}</h3>
                                            <div className="flex gap-2 text-xs text-gray-500">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded">{set.bodyPart}</span>
                                                <span>{set.timestamp}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-gray-800">{set.weight}kg</div>
                                            <div className="text-xs text-gray-400 uppercase tracking-tighter">{set.reps} REPS</div>
                                        </div>
                                        <button 
                                            onClick={() => handleDeleteSet(set.id)}
                                            className="text-gray-300 hover:text-red-500 transition-colors p-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v2m3 3h.01" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
