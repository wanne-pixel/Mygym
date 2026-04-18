import React, { useState } from 'react';
import { supabase } from '../../api/supabase';

const LoginScreen = () => {
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            alert('이메일과 비밀번호를 입력해주세요.');
            return;
        }
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setIsLoading(false);
        if (error) alert('로그인 실패: ' + error.message);
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({ 
            provider: 'google',
            options: { redirectTo: window.location.origin }
        });
        if (error) alert('구글 로그인 실패: ' + error.message);
    };

    const handleSignupComplete = async () => {
        if (!email || !password) { alert('이메일과 비밀번호는 필수입니다.'); return; }
        if (password !== passwordConfirm) { alert('비밀번호가 일치하지 않습니다.'); return; }
        
        setIsLoading(true);
        const { data, error } = await supabase.auth.signUp({ email, password });
        setIsLoading(false);

        if (error) {
            alert('회원가입 실패: ' + error.message);
        } else {
            alert('가입하신 이메일로 인증 메일이 발송되었습니다!');
            setIsSignup(false);
        }
    };

    if (isSignup) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 animate-fade-in bg-slate-950">
                <div className="w-full max-sm space-y-8">
                    <button onClick={() => setIsSignup(false)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 group">
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        <span className="font-medium">돌아가기</span>
                    </button>
                    <div className="text-center">
                        <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">회원가입</h2>
                    </div>
                    <div className="space-y-4 bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
                        <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                        <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                        <input type="password" placeholder="비밀번호 확인" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                        <button onClick={handleSignupComplete} disabled={isLoading} className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl active:scale-95 transition-all">가입 완료</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 bg-slate-950">
            <div className="mb-12 text-center">
                <h1 className="text-6xl font-extrabold italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">MyGym</h1>
                <p className="mt-2 text-gray-400 font-medium tracking-wide uppercase italic">Level up your limits</p>
            </div>
            <div className="w-full max-sm space-y-4">
                <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                <div className="flex gap-3">
                    <button onClick={handleLogin} disabled={isLoading} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl active:scale-95 transition-all">로그인</button>
                    <button onClick={() => setIsSignup(true)} className="flex-1 py-4 bg-slate-700 text-white font-bold rounded-xl active:scale-95 transition-all">회원가입</button>
                </div>
                <button onClick={handleGoogleLogin} className="w-full py-4 bg-white text-slate-900 font-bold rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" /> Google로 시작하기
                </button>
            </div>
        </div>
    );
};

export default LoginScreen;
