import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackButton = () => {
    const navigate = useNavigate();
    return (
        <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group">
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
            <span className="font-medium">돌아가기</span>
        </button>
    );
};

export default BackButton;
