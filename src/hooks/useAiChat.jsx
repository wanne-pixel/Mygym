import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '../api/supabase';
import { toast } from 'sonner';

const AiChatContext = createContext();

export const AiChatProvider = ({ children }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { id: 'welcome', type: 'ai', text: '안녕하세요! 저는 MyGym AI 코치입니다. 무엇을 도와드릴까요?' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [cart, setCart] = useState([]);
    
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [currentTab, setCurrentTab] = useState('달력');

    // Update currentTab based on route
    useEffect(() => {
        if (location.pathname === '/app') {
            const tab = searchParams.get('tab');
            setCurrentTab(tab || '달력');
        } else if (location.pathname === '/routine-detail') {
            setCurrentTab('달력');
        } else {
            setCurrentTab('other');
        }
    }, [location.pathname, searchParams]);

    const toggleChat = useCallback(() => setIsOpen(prev => !prev), []);
    const openChat = useCallback(() => setIsOpen(true), []);
    const closeChat = useCallback(() => setIsOpen(false), []);

    const addToCart = useCallback((items) => {
        const newItems = Array.isArray(items) ? items : [items];
        setCart(prev => [...prev, ...newItems]);
        toast.success(`장바구니에 ${newItems.length}개의 운동이 추가되었습니다.`);
        return true; // Indicate success for UI components
    }, []);

    const sendMessage = useCallback(async (text) => {
        if (!text.trim()) return;

        const userMessage = { id: Date.now().toString(), type: 'user', text };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error('로그인이 필요합니다.');
                setIsLoading(false);
                return;
            }

            // Fetch recent workouts for context (last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const { data: recentWorkouts } = await supabase
                .from('workout_logs')
                .select('*')
                .eq('user_id', session.user.id)
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: false });

            // Include currentTab in the payload to give AI context
            const payload = {
                type: 'chat',
                userPrompt: text,
                currentTab,
                recentWorkouts: recentWorkouts || [],
                history: messages.slice(-5) // Send last 5 messages for context
            };

            const { data, error } = await supabase.functions.invoke('ai-coach', {
                body: payload,
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            if (error) throw error;

            const aiResponse = { 
                id: (Date.now() + 1).toString(), 
                type: 'ai', 
                text: data.reply || '죄송합니다. 응답을 생성하지 못했습니다.' 
            };
            setMessages(prev => [...prev, aiResponse]);

        } catch (error) {
            console.error('AI Coach Error:', error);
            const errorMessage = { 
                id: (Date.now() + 1).toString(), 
                type: 'ai', 
                text: '통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    }, [messages, currentTab]);

    return (
        <AiChatContext.Provider value={{
            isOpen, toggleChat, openChat, closeChat,
            messages, sendMessage, isLoading,
            cart, addToCart, currentTab
        }}>
            {children}
        </AiChatContext.Provider>
    );
};

export const useAiChat = () => {
    const context = useContext(AiChatContext);
    if (!context) {
        throw new Error('useAiChat must be used within an AiChatProvider');
    }
    return context;
};
