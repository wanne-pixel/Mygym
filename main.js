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

const exerciseGuide = {
    '벤치프레스': {
        img: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=400&auto=format&fit=crop',
        tip: '바벨을 가슴 중앙으로 내리고 팔꿈치가 너무 벌어지지 않게 주의하세요. 발바닥을 지면에 밀착시켜 몸을 고정합니다.'
    },
    '스쿼트': {
        img: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=400&auto=format&fit=crop',
        tip: '무릎이 발끝보다 너무 나가지 않게 하고, 허리를 곧게 펴세요. 뒤꿈치에 무게 중심을 둡니다.'
    },
    '데드리프트': {
        img: 'https://images.unsplash.com/photo-1603287611630-d645505294ad?q=80&w=400&auto=format&fit=crop',
        tip: '등이 굽지 않도록 척추 중립을 유지하세요. 바를 몸에 가깝게 붙여 수직으로 들어올립니다.'
    },
    '렛풀다운': {
        img: 'https://images.unsplash.com/photo-1590239068512-63200218677f?q=80&w=400&auto=format&fit=crop',
        tip: '상체를 살짝 뒤로 젖히고 쇄골 방향으로 바를 당기세요. 어깨가 들리지 않도록 견갑을 하강합니다.'
    },
    '사이드 레터럴 레이즈': {
        img: 'https://images.unsplash.com/photo-1532029837206-abbe2b7620e3?q=80&w=400&auto=format&fit=crop',
        tip: '팔을 던지듯 들어올리지 말고 어깨의 힘으로 천천히 올리세요. 손목이 팔꿈치보다 높지 않게 합니다.'
    },
    '레그 프레스': {
        img: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?q=80&w=400&auto=format&fit=crop',
        tip: '발판의 위치가 높을수록 둔근, 낮을수록 대퇴사두근에 집중됩니다. 무릎을 완전히 펴서 관절을 잠그지 마세요.'
    }
};

const App = () => {
    const [selectedBodyPart, setSelectedBodyPart] = useState('');
    const [isCustomBodyPart, setIsCustomBodyPart] = useState(false);
    const [customBodyPart, setCustomBodyPart] = useState('');

    const [selectedType, setSelectedType] = useState('');
    const [isCustomType, setIsCustomType] = useState(false);
    const [customType, setCustomType] = useState('');

    const [selectedExercise, setSelectedExercise] = useState('');
    const [isCustomExercise, setIsCustomExercise] = useState(false);
    const [customExercise, setCustomExercise] = useState('');

    const [weight, setWeight] = useState('');
    const [reps, setReps] = useState('');
    const [sets, setSets] = useState([]);

    const bodyParts = Object.keys(exerciseData);
    const types = (selectedBodyPart && !isCustomBodyPart) ? Object.keys(exerciseData[selectedBodyPart]) : [];
    const exercises = (selectedBodyPart && !isCustomBodyPart && selectedType && !isCustomType) ? exerciseData[selectedBodyPart][selectedType] : [];

    // 현재 선택된 운동의 가이드 정보 가져오기
    const currentGuide = exerciseGuide[selectedExercise];

    const handleAddSet = (e) => {
        e.preventDefault();
        
        const finalBodyPart = isCustomBodyPart ? customBodyPart : selectedBodyPart;
        const finalExercise = isCustomExercise ? customExercise : selectedExercise;

        if (!finalExercise || !weight || !reps) return;

        const newSet = {
            id: Date.now(),
            exercise: finalExercise,
            bodyPart: finalBodyPart,
            weight: weight,
            reps: reps,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setSets([newSet, ...sets]);
        setWeight('');
        setReps('');
        if (isCustomExercise) setCustomExercise('');
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
                            <div className="grid grid-cols-3 gap-2 mb-2">
                                {bodyParts.map(part => (
                                    <button
                                        key={part}
                                        type="button"
                                        onClick={() => {
                                            setSelectedBodyPart(part);
                                            setIsCustomBodyPart(false);
                                            setSelectedType('');
                                            setIsCustomType(false);
                                            setSelectedExercise('');
                                            setIsCustomExercise(false);
                                        }}
                                        className={`py-2 text-sm rounded-xl transition-all ${
                                            (selectedBodyPart === part && !isCustomBodyPart)
                                            ? 'bg-indigo-600 text-white shadow-md' 
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {part}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCustomBodyPart(true);
                                        setSelectedBodyPart('');
                                        setIsCustomType(true);
                                        setIsCustomExercise(true);
                                    }}
                                    className={`py-2 text-sm rounded-xl transition-all ${
                                        isCustomBodyPart 
                                        ? 'bg-orange-500 text-white shadow-md' 
                                        : 'bg-orange-50 text-orange-600 border border-orange-100'
                                    }`}
                                >
                                    기타
                                </button>
                            </div>
                            {isCustomBodyPart && (
                                <input
                                    type="text"
                                    placeholder="부위 직접 입력 (예: 코어)"
                                    value={customBodyPart}
                                    onChange={(e) => setCustomBodyPart(e.target.value)}
                                    className="w-full p-2 bg-orange-50 border border-orange-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-orange-500 animate-fade-in"
                                />
                            )}
                        </div>

                        {/* 2. 종류 */}
                        {(selectedBodyPart || isCustomBodyPart) && (
                            <div className="animate-fade-in">
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">운동 종류</label>
                                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-2">
                                    {!isCustomBodyPart && types.map(type => (
                                        <button
                                            key={type}
                                            type="button"
                                            onClick={() => {
                                                setSelectedType(type);
                                                setIsCustomType(false);
                                                setSelectedExercise('');
                                                setIsCustomExercise(false);
                                            }}
                                            className={`px-4 py-2 text-sm whitespace-nowrap rounded-full transition-all border ${
                                                (selectedType === type && !isCustomType)
                                                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold' 
                                                : 'border-gray-200 text-gray-500'
                                            }`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsCustomType(true);
                                            setSelectedType('');
                                            setIsCustomExercise(true);
                                        }}
                                        className={`px-4 py-2 text-sm whitespace-nowrap rounded-full transition-all border ${
                                            isCustomType 
                                            ? 'border-orange-500 bg-orange-50 text-orange-700 font-semibold' 
                                            : 'border-orange-100 text-orange-500'
                                        }`}
                                    >
                                        기타
                                    </button>
                                </div>
                                {isCustomType && (
                                    <input
                                        type="text"
                                        placeholder="종류 직접 입력 (예: 맨몸)"
                                        value={customType}
                                        onChange={(e) => setCustomType(e.target.value)}
                                        className="w-full p-2 bg-orange-50 border border-orange-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-orange-500 animate-fade-in"
                                    />
                                )}
                            </div>
                        )}

                        {/* 3. 기구명 */}
                        {(selectedType || isCustomType) && (
                            <div className="animate-fade-in">
                                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">기구명</label>
                                {!isCustomType ? (
                                    <select 
                                        value={isCustomExercise ? 'custom' : selectedExercise}
                                        onChange={(e) => {
                                            if (e.target.value === 'custom') {
                                                setIsCustomExercise(true);
                                                setSelectedExercise('');
                                            } else {
                                                setIsCustomExercise(false);
                                                setSelectedExercise(e.target.value);
                                            }
                                        }}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all mb-2"
                                    >
                                        <option value="">운동을 선택하세요</option>
                                        {exercises.map(ex => (
                                            <option key={ex} value={ex}>{ex}</option>
                                        ))}
                                        <option value="custom">+ 직접 입력</option>
                                    </select>
                                ) : null}
                                {(isCustomExercise || isCustomType) && (
                                    <input
                                        type="text"
                                        placeholder="기구/운동 이름 직접 입력"
                                        value={customExercise}
                                        onChange={(e) => setCustomExercise(e.target.value)}
                                        className="w-full p-3 bg-orange-50 border border-orange-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500 animate-fade-in"
                                    />
                                )}
                            </div>
                        )}

                        {/* Exercise Guide Section (Visible when an exercise with a guide is selected) */}
                        {currentGuide && !isCustomExercise && (
                            <div className="animate-fade-in bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                <div className="flex gap-4 items-start">
                                    <img 
                                        src={currentGuide.img} 
                                        alt={selectedExercise}
                                        className="w-24 h-24 object-cover rounded-lg shadow-sm border border-white"
                                    />
                                    <div className="flex-1">
                                        <h4 className="text-sm font-bold text-indigo-800 mb-1">💡 초보자 가이드</h4>
                                        <p className="text-xs text-indigo-600 leading-relaxed">
                                            {currentGuide.tip}
                                        </p>
                                    </div>
                                </div>
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
                            disabled={(!isCustomExercise && !selectedExercise) || !weight || !reps || (isCustomExercise && !customExercise)}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg active:scale-95 ${
                                ((!isCustomExercise && !selectedExercise) || !weight || !reps || (isCustomExercise && !customExercise))
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
