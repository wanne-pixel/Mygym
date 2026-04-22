import React, { useState } from 'react';
import { supabase } from '../../api/supabase';

const MIN_PASSWORD_LENGTH = 8;

const LoginScreen = ({ session, isChecking, onStart }) => {
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const REDIRECT_URL = `${window.location.origin}/app`;

    const validatePassword = (pw) => {
        if (pw.length < MIN_PASSWORD_LENGTH) return `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`;
        return null;
    };

    const handleLogin = async () => {
        setErrorMsg('');
        if (!email || !password) { setErrorMsg('이메일과 비밀번호를 입력해주세요.'); return; }
        setIsLoading(true);
        const { data: { session: newSession }, error } = await supabase.auth.signInWithPassword({ email, password });
        setIsLoading(false);
        if (error) setErrorMsg('이메일 또는 비밀번호가 올바르지 않습니다.');
        else if (onStart && newSession) onStart(newSession);
    };

    const handleGoogleLogin = async () => {
        setErrorMsg('');
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: REDIRECT_URL }
        });
        if (error) setErrorMsg('구글 로그인에 실패했습니다. 다시 시도해주세요.');
    };

    const handleSignupComplete = async () => {
        setErrorMsg('');
        if (!email || !password) { setErrorMsg('이메일과 비밀번호는 필수입니다.'); return; }
        const pwError = validatePassword(password);
        if (pwError) { setErrorMsg(pwError); return; }
        if (password !== passwordConfirm) { setErrorMsg('비밀번호가 일치하지 않습니다.'); return; }

        setIsLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: REDIRECT_URL }
        });
        setIsLoading(false);

        if (error) {
            setErrorMsg('회원가입에 실패했습니다. 다시 시도해주세요.');
        } else {
            alert('가입하신 이메일로 인증 메일이 발송되었습니다!');
            setIsSignup(false);
        }
    };

    if (isSignup) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 animate-fade-in bg-slate-950">
                <div className="w-full lg:max-w-md space-y-8">
                    <button onClick={() => setIsSignup(false)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 group">
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        <span className="font-medium">돌아가기</span>
                    </button>
                    <div className="text-center">
                        <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">회원가입</h2>
                    </div>
                    <div className="space-y-4 bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
                        <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                        <input type="password" placeholder={`비밀번호 (${MIN_PASSWORD_LENGTH}자 이상)`} value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                        <input type="password" placeholder="비밀번호 확인" value={passwordConfirm} onChange={e => setPasswordConfirm(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                        {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
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
            
            <div className="w-full lg:max-w-md space-y-4">
                {session ? (
                    <div className="space-y-4 animate-fade-in">
                        <div className="bg-slate-900/50 p-6 rounded-3xl border border-blue-500/20 text-center">
                            <p className="text-slate-400 text-sm mb-1">반가워요!</p>
                            <p className="text-white font-bold truncate mb-6">{session.user.email}</p>
                            <button 
                                onClick={onStart} 
                                disabled={isChecking}
                                className="w-full py-4 bg-blue-600 text-white font-black italic rounded-2xl shadow-lg shadow-blue-600/20 active:scale-95 transition-all uppercase tracking-tighter text-xl"
                            >
                                {isChecking ? 'Checking...' : 'Start Training'}
                            </button>
                        </div>
                        <button 
                            onClick={() => supabase.auth.signOut()} 
                            className="w-full py-3 text-slate-500 font-bold text-sm hover:text-rose-400 transition-colors"
                        >
                            다른 계정으로 로그인
                        </button>
                    </div>
                ) : (
                    <>
                        <input type="email" placeholder="이메일" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                        <input type="password" placeholder="비밀번호" value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none" />
                        {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
                        <div className="flex gap-3">
                            <button onClick={handleLogin} disabled={isLoading} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl active:scale-95 transition-all">로그인</button>
                            <button onClick={() => { setIsSignup(true); setErrorMsg(''); }} className="flex-1 py-4 bg-slate-700 text-white font-bold rounded-xl active:scale-95 transition-all">회원가입</button>
                        </div>
                        <button onClick={handleGoogleLogin} className="w-full py-4 bg-white text-slate-900 font-bold rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" /> Google로 시작하기
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default LoginScreen;
