import React, { useState, useEffect, useRef } from 'react';
import { useAiChat } from '../../hooks/useAiChat';
import ChatMessage from '../ChatMessage';
import { X, Send, Bot, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AiBottomSheet = () => {
    const { isOpen, closeChat, messages, sendMessage, isLoading, currentTab, addToCart } = useAiChat();
    const [inputValue, setInputValue] = useState('');
    const messagesEndRef = useRef(null);

    // Scroll to bottom whenever messages change
    useEffect(() => {
        if (isOpen && messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

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

    // Dynamic chips based on currentTab
    const getChips = () => {
        switch (currentTab) {
            case '달력':
                return [
                    { text: '이번 달 운동 요약해줘', icon: '📅' },
                    { text: '최근 가장 많이 한 부위가 어디야?', icon: '🔍' },
                    { text: '부족한 운동부위는 어디야?', icon: '📉' }
                ];
            case '운동':
                return [
                    { text: '평소에 안하던 부위 루틴 만들어줘', icon: '🎯' },
                    { text: '부족한 부위 루틴 만들어줘', icon: '💪' }
                ];
            case 'analysis':
                return [
                    { text: '밸런스가 가장 부족한 부위가 어디야?', icon: '⚖️' },
                    { text: '점진적 과부하가 가장 더딘 부위가 어디야?', icon: '🐢' }
                ];
            default:
                return [
                    { text: '오늘의 운동 추천해줘', icon: '💡' },
                    { text: '최근 운동 기록 요약해줘', icon: '📝' },
                    { text: '어떤 부위를 운동할 차례야?', icon: '🤔' }
                ];
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeChat}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 lg:left-56 z-[101] h-[85vh] md:h-[600px] bg-slate-950 border-t border-slate-800 rounded-t-3xl shadow-[0_-10px_40px_-15px_rgba(59,130,246,0.3)] flex flex-col"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/5">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-600/20 p-2 rounded-xl text-blue-400">
                                    <Bot size={20} />
                                </div>
                                <div>
                                    <h3 className="text-white font-black italic tracking-tight">AI COACH</h3>
                                    <p className="text-xs text-blue-400 font-bold">Context-Aware Omni AI</p>
                                </div>
                            </div>
                            <button
                                onClick={closeChat}
                                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Note for 30-day limit on Calendar tab */}
                        {currentTab === '달력' && (
                            <div className="bg-blue-900/20 px-4 py-2 flex items-start gap-2 border-b border-blue-900/30">
                                <Info size={14} className="text-blue-400 mt-0.5 shrink-0" />
                                <p className="text-[11px] text-blue-300/80 font-medium leading-tight">
                                    최근 30일간의 데이터를 기반으로 빠르고 정확한 요약/추천을 제공합니다.
                                </p>
                            </div>
                        )}

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
                                    <div className="bg-slate-800 rounded-2xl rounded-tl-none p-4 border border-white/5 flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Suggestion Chips */}
                        <div className="px-4 py-2 flex flex-col gap-2">
                            {getChips().map((chip, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleSend(chip.text)}
                                    className="w-full text-left px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-bold rounded-xl transition-colors border border-white/5 shadow-sm flex items-center gap-2"
                                >
                                    <span className="text-lg">{chip.icon}</span>
                                    <span>{chip.text}</span>
                                </button>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-slate-900 border-t border-white/5">
                            <div className="relative">
                                <textarea
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="무엇이든 물어보세요..."
                                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-4 pr-12 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none overflow-hidden h-12 flex items-center"
                                    rows="1"
                                />
                                <button
                                    onClick={() => handleSend(inputValue)}
                                    disabled={!inputValue.trim() || isLoading}
                                    className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
                                >
                                    <Send size={16} className={inputValue.trim() ? "translate-x-0.5 -translate-y-0.5" : ""} />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AiBottomSheet;
