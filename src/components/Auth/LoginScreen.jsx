import React, { useState } from 'react';
import { supabase } from '../../api/supabase';

const MIN_PASSWORD_LENGTH = 8;

const LoginScreen = ({ session, isChecking, onStart }) => {
    const [isSignup, setIsSignup] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [otpEmail, setOtpEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const REDIRECT_URL = `${window.location.origin}/app`;

    const validatePassword = (pw) => {
        if (pw.length < MIN_PASSWORD_LENGTH) return `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`;
        if (!/[a-zA-Z]/.test(pw)) return '영문자를 포함해야 합니다.';
        if (!/[0-9]/.test(pw)) return '숫자를 포함해야 합니다.';
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
            setOtpEmail(email);
            setShowOtp(true);
            setErrorMsg('');
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) { setErrorMsg('6자리 인증번호를 입력해주세요.'); return; }
        setErrorMsg('');
        setIsVerifying(true);
        const { data: { session: newSession }, error } = await supabase.auth.verifyOtp({
            email: otpEmail,
            token: otp,
            type: 'signup'
        });
        setIsVerifying(false);
        if (error) {
            setErrorMsg('인증번호가 올바르지 않거나 만료되었습니다.');
        } else if (newSession && onStart) {
            onStart(newSession);
        } else {
            setErrorMsg('인증에 실패했습니다. 다시 시도해주세요.');
        }
    };

    const handleResendOtp = async () => {
        setErrorMsg('');
        const { error } = await supabase.auth.resend({ type: 'signup', email: otpEmail });
        if (error) setErrorMsg('재발송에 실패했습니다. 잠시 후 다시 시도해주세요.');
        else alert('인증번호가 재발송되었습니다. 이메일을 확인해주세요.');
    };

    // ── OTP 인증 화면 ──────────────────────────────────────────
    if (showOtp) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 animate-fade-in bg-slate-950">
                <div className="w-full lg:max-w-md space-y-8">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase mb-3">이메일 인증</h2>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                            <span className="text-blue-400 font-bold">{otpEmail}</span>으로<br />
                            6자리 인증번호가 발송되었습니다.
                        </p>
                    </div>
                    <div className="space-y-4 bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={otp}
                            onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            onKeyDown={e => e.key === 'Enter' && otp.length === 6 && handleVerifyOtp()}
                            placeholder="000000"
                            autoFocus
                            className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white text-center text-3xl font-black tracking-[0.6em] focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-700 placeholder:tracking-normal placeholder:text-base"
                        />
                        {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
                        <button
                            onClick={handleVerifyOtp}
                            disabled={isVerifying || otp.length !== 6}
                            className="w-full py-4 bg-blue-600 disabled:opacity-40 text-white font-bold rounded-xl active:scale-95 transition-all"
                        >
                            {isVerifying ? '인증 중...' : '인증 완료'}
                        </button>
                        <div className="flex items-center justify-between pt-1">
                            <button
                                onClick={() => { setShowOtp(false); setIsSignup(true); setOtp(''); setErrorMsg(''); }}
                                className="text-slate-500 text-sm font-medium hover:text-slate-300 transition-colors"
                            >
                                돌아가기
                            </button>
                            <button
                                onClick={handleResendOtp}
                                className="text-blue-400 text-sm font-bold hover:text-blue-300 transition-colors"
                            >
                                인증번호 재발송
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── 회원가입 화면 ──────────────────────────────────────────
    if (isSignup) {
        const pwLengthOk = password.length >= MIN_PASSWORD_LENGTH;
        const pwLetterOk = /[a-zA-Z]/.test(password);
        const pwNumberOk = /[0-9]/.test(password);

        return (
            <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 animate-fade-in bg-slate-950">
                <div className="w-full lg:max-w-md space-y-8">
                    <button
                        onClick={() => { setIsSignup(false); setErrorMsg(''); }}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                    >
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="font-medium">돌아가기</span>
                    </button>
                    <div className="text-center">
                        <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">회원가입</h2>
                    </div>
                    <div className="space-y-4 bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
                        <input
                            type="email"
                            placeholder="이메일"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <div className="space-y-2">
                            <input
                                type="password"
                                placeholder="비밀번호"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            {/* 실시간 비밀번호 조건 표시 */}
                            <div className="flex gap-4 px-1">
                                <span className={`text-xs font-bold flex items-center gap-1.5 transition-colors ${pwLengthOk ? 'text-green-400' : 'text-slate-600'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${pwLengthOk ? 'bg-green-400' : 'bg-slate-600'}`} />
                                    8자 이상
                                </span>
                                <span className={`text-xs font-bold flex items-center gap-1.5 transition-colors ${pwLetterOk ? 'text-green-400' : 'text-slate-600'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${pwLetterOk ? 'bg-green-400' : 'bg-slate-600'}`} />
                                    영문 포함
                                </span>
                                <span className={`text-xs font-bold flex items-center gap-1.5 transition-colors ${pwNumberOk ? 'text-green-400' : 'text-slate-600'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${pwNumberOk ? 'bg-green-400' : 'bg-slate-600'}`} />
                                    숫자 포함
                                </span>
                            </div>
                        </div>
                        <input
                            type="password"
                            placeholder="비밀번호 확인"
                            value={passwordConfirm}
                            onChange={e => setPasswordConfirm(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleSignupComplete()}
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
                        <button
                            onClick={handleSignupComplete}
                            disabled={isLoading}
                            className="w-full py-4 bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl active:scale-95 transition-all"
                        >
                            {isLoading ? '처리 중...' : '인증 메일 발송'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── 로그인 화면 ────────────────────────────────────────────
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
                        <input
                            type="email"
                            placeholder="이메일"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <input
                            type="password"
                            placeholder="비밀번호"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleLogin()}
                            className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
                        <div className="flex gap-3">
                            <button
                                onClick={handleLogin}
                                disabled={isLoading}
                                className="flex-1 py-4 bg-blue-600 disabled:opacity-50 text-white font-bold rounded-xl active:scale-95 transition-all"
                            >
                                {isLoading ? '로그인 중...' : '로그인'}
                            </button>
                            <button
                                onClick={() => { setIsSignup(true); setErrorMsg(''); }}
                                className="flex-1 py-4 bg-slate-700 text-white font-bold rounded-xl active:scale-95 transition-all"
                            >
                                회원가입
                            </button>
                        </div>
                        <button
                            onClick={handleGoogleLogin}
                            className="w-full py-4 bg-white text-slate-900 font-bold rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" />
                            Google로 시작하기
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default LoginScreen;
