import React, { useState, useEffect, useRef } from 'react';
import { useAiChat } from '../hooks/useAiChat';
import ChatMessage from '../components/ChatMessage';
import { Send, Bot, Trash2 } from 'lucide-react';

const CoachPage = () => {
    const { messages, sendMessage, isLoading, addToCart } = useAiChat();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    // Scroll to bottom whenever messages change
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    const handleSend = (text) => {
        if (text.trim()) {
            sendMessage(text);
            setInputValue('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend(inputValue);
        }
    };



    return (
        <div className="flex flex-col h-[100dvh] lg:h-screen pb-[80px] lg:pb-0 bg-slate-950 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-950/80 backdrop-blur-md sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="bg-indigo-600/20 p-2 rounded-xl text-indigo-400">
                        <Bot size={24} />
                    </div>
                    <div>
                        <h1 className="text-lg text-white font-black italic tracking-tight uppercase">Master AI Coach</h1>
                        <p className="text-[11px] text-indigo-400 font-bold">무엇이든 물어보세요</p>
                    </div>
                </div>
                {/* 대화 초기화 버튼 (새로고침) */}
                <button 
                    onClick={() => window.location.reload()}
                    className="p-2 text-slate-500 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-full transition-colors"
                    title="대화 초기화"
                >
                    <Trash2 size={18} />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                {messages.map((msg, idx) => (
                    <ChatMessage 
                        key={msg.id || idx} 
                        msg={msg} 
                        onAddRoutineItem={addToCart}
                    />
                ))}
                {isLoading && (
                    <div className="flex items-start">
                        <div className="bg-slate-800 rounded-2xl rounded-tl-none p-4 border border-white/5 flex items-center gap-2 shadow-lg">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Bottom Fixed Area (Chips + Input) */}
            <div className="bg-slate-900 border-t border-white/5 p-4 space-y-3 shrink-0 lg:mb-0">


                {/* Input Area */}
                <div className="relative">
                    <textarea
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="마스터 코치에게 종합적인 질문을 해보세요..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-4 pr-12 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all resize-none overflow-hidden h-[52px] flex items-center shadow-inner"
                        rows="1"
                    />
                    <button
                        onClick={() => handleSend(inputValue)}
                        disabled={!inputValue.trim() || isLoading}
                        className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                    >
                        <Send size={18} className={inputValue.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CoachPage;
