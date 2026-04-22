import React from 'react';
import RoutineList from './RoutineList';

const ChatMessage = ({ msg, onAddRoutineItem }) => {
    // ROUTINE_DATA 태그를 찾기 위한 정규식 (객체 {} 또는 배열 [] 모두 대응)
    const routineRegex = /\[ROUTINE_DATA:\s*(\{.*?\}|\[.*?\])\]/gs;
    
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = routineRegex.exec(msg.text)) !== null) {
        if (match.index > lastIndex) {
            parts.push({ type: 'text', content: msg.text.substring(lastIndex, match.index) });
        }

        try {
            const extractedText = match[1];
            // 1. 파싱
            let parsed = JSON.parse(extractedText);
            
            // 2. 객체 안에 배열이 숨어있는 경우 추출 (예: { routines: [...] })
            if (!Array.isArray(parsed)) {
                const arrayKey = Object.keys(parsed).find(key => Array.isArray(parsed[key]));
                parsed = arrayKey ? parsed[arrayKey] : [parsed];
            }
            
            // 3. 평탄화 및 키(Key) 강제 매핑 (궁극의 데이터 정제)
            const safeRoutineData = parsed.flat(Infinity).map(item => {
                if (typeof item === 'string') {
                    let name = item;
                    let isDropSet = false;
                    if (name.includes('(드롭)')) {
                        name = name.replace('(드롭)', '').trim();
                        isDropSet = true;
                    }
                    return { name, name_en: "", sets: 4, reps: 12, weight: 0, isDropSet };
                }
                
                let name = item.name || item.Name || item.운동명 || item.운동이름 || item.exercise || "알 수 없는 운동";
                let name_en = item.name_en || item.nameEn || item.exerciseEn || "";
                let part = item.part || item.Part || item.부위 || "";
                let isDropSet = item.isDropSet || false;
                
                if (name.includes('(드롭)')) {
                    name = name.replace('(드롭)', '').trim();
                    isDropSet = true;
                }

                return {
                    name,
                    name_en,
                    part,
                    sets: item.sets || item.Sets || item.세트 || 0,
                    reps: item.reps || item.Reps || item.횟수 || item.반복수 || 0,
                    weight: item.weight || item.Weight || item.무게 || item.중량 || 0,
                    isDropSet
                };
            });

            parts.push({ type: 'routine_list', data: safeRoutineData });
        } catch (e) {
            console.error("JSON parse error in message bubble", e);
            parts.push({ type: 'text', content: match[0] });
        }

        lastIndex = routineRegex.lastIndex;
    }

    if (lastIndex < msg.text.length) {
        parts.push({ type: 'text', content: msg.text.substring(lastIndex) });
    }

    return (
        <div className={`flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}>
            <div className={`max-w-[90%] p-4 rounded-[1.5rem] text-sm leading-relaxed ${
                msg.type === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-600/10' 
                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
            }`}>
                {parts.map((part, idx) => {
                    if (part.type === 'text') {
                        return <span key={idx} className="whitespace-pre-wrap">{part.content}</span>;
                    } else {
                        return (
                            <RoutineList 
                                key={idx} 
                                data={part.data} 
                                onAddItem={onAddRoutineItem} 
                            />
                        );
                    }
                })}
            </div>
        </div>
    );
};

export default ChatMessage;
