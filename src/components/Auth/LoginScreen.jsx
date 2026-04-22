import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../api/supabase';

const MIN_PASSWORD_LENGTH = 8;

const LoginScreen = ({ session, isChecking, onStart }) => {
    const { t, i18n } = useTranslation();
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

    const toggleLanguage = () => {
        const next = i18n.language === 'ko' ? 'en' : 'ko';
        i18n.changeLanguage(next);
        localStorage.setItem('mygym_lang', next);
    };

    const validatePassword = (pw) => {
        if (pw.length < MIN_PASSWORD_LENGTH) return t('auth.error.passwordTooShort', { min: MIN_PASSWORD_LENGTH });
        if (!/[a-zA-Z]/.test(pw)) return t('auth.error.passwordNeedsLetter');
        if (!/[0-9]/.test(pw)) return t('auth.error.passwordNeedsNumber');
        return null;
    };

    const handleLogin = async () => {
        setErrorMsg('');
        if (!email || !password) { setErrorMsg(t('auth.error.emailPasswordRequired')); return; }
        setIsLoading(true);
        const { data: { session: newSession }, error } = await supabase.auth.signInWithPassword({ email, password });
        setIsLoading(false);
        if (error) setErrorMsg(t('auth.error.invalidCredentials'));
        else if (onStart && newSession) onStart(newSession);
    };

    const handleGoogleLogin = async () => {
        setErrorMsg('');
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: REDIRECT_URL }
        });
        if (error) setErrorMsg(t('auth.error.googleFailed'));
    };

    const handleSignupComplete = async () => {
        setErrorMsg('');
        if (!email || !password) { setErrorMsg(t('auth.error.emailPasswordRequired2')); return; }
        const pwError = validatePassword(password);
        if (pwError) { setErrorMsg(pwError); return; }
        if (password !== passwordConfirm) { setErrorMsg(t('auth.error.passwordMismatch')); return; }

        setIsLoading(true);
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: REDIRECT_URL }
        });
        setIsLoading(false);

        if (error) {
            setErrorMsg(t('auth.error.signupFailed'));
        } else {
            setOtpEmail(email);
            setShowOtp(true);
            setErrorMsg('');
        }
    };

    const handleVerifyOtp = async () => {
        if (otp.length !== 6) { setErrorMsg(t('auth.otp.inputHint')); return; }
        setErrorMsg('');
        setIsVerifying(true);
        const { data: { session: newSession }, error } = await supabase.auth.verifyOtp({
            email: otpEmail,
            token: otp,
            type: 'signup'
        });
        setIsVerifying(false);
        if (error) {
            setErrorMsg(t('auth.otp.error'));
        } else if (newSession && onStart) {
            onStart(newSession);
        } else {
            setErrorMsg(t('auth.otp.failed'));
        }
    };

    const handleResendOtp = async () => {
        setErrorMsg('');
        const { error } = await supabase.auth.resend({ type: 'signup', email: otpEmail });
        if (error) setErrorMsg(t('auth.otp.resendFailed'));
        else alert(t('auth.otp.resendSuccess'));
    };

    // ── 로그인 화면 ────────────────────────────────────────────
    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen px-6 bg-slate-950">
            {/* 언어 전환 버튼: 강제 위치 및 명시적 스타일링 */}
            <button
                onClick={toggleLanguage}
                className="absolute top-4 right-4 z-50 text-white border border-white/50 px-3 py-1 rounded-md bg-black/20 hover:bg-white/10 backdrop-blur-sm transition-all text-sm font-medium"
            >
                {i18n.language === 'ko' ? 'EN' : '한'}
            </button>

            {showOtp ? (
                /* OTP 인증 화면 */
                <div className="w-full lg:max-w-md space-y-8 animate-fade-in">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase mb-3">{t('auth.otp.title')}</h2>
                        <p className="text-slate-400 text-sm font-medium leading-relaxed">
                            <span className="text-blue-400 font-bold">{otpEmail}</span><br />
                            {t('auth.otp.sent')}
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
                            placeholder={t('auth.otp.placeholder')}
                            autoFocus
                            className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white text-center text-3xl font-black tracking-[0.6em] focus:ring-2 focus:ring-blue-500 outline-none placeholder:text-slate-700 placeholder:tracking-normal placeholder:text-base"
                        />
                        {errorMsg && <p className="text-red-400 text-sm text-center">{errorMsg}</p>}
                        <button
                            onClick={handleVerifyOtp}
                            disabled={isVerifying || otp.length !== 6}
                            className="w-full py-4 bg-blue-600 disabled:opacity-40 text-white font-bold rounded-xl active:scale-95 transition-all"
                        >
                            {isVerifying ? t('auth.otp.verifying') : t('auth.otp.verify')}
                        </button>
                        <div className="flex items-center justify-between pt-1">
                            <button
                                onClick={() => { setShowOtp(false); setIsSignup(true); setOtp(''); setErrorMsg(''); }}
                                className="text-slate-500 text-sm font-medium hover:text-slate-300 transition-colors"
                            >
                                {t('common.back')}
                            </button>
                            <button
                                onClick={handleResendOtp}
                                className="text-blue-400 text-sm font-bold hover:text-blue-300 transition-colors"
                            >
                                {t('auth.otp.resend')}
                            </button>
                        </div>
                    </div>
                </div>
            ) : isSignup ? (
                /* 회원가입 화면 */
                <div className="w-full lg:max-w-md space-y-8 animate-fade-in">
                    <button
                        onClick={() => { setIsSignup(false); setErrorMsg(''); }}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
                    >
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="font-medium">{t('common.back')}</span>
                    </button>
                    <div className="text-center">
                        <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">{t('auth.signup')}</h2>
                    </div>
                    <div className="space-y-4 bg-slate-900/50 p-8 rounded-3xl border border-slate-800">
                        <input
                            type="email"
                            placeholder={t('auth.email')}
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <div className="space-y-2">
                            <input
                                type="password"
                                placeholder={t('auth.password')}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                            <div className="flex gap-4 px-1">
                                <span className={`text-xs font-bold flex items-center gap-1.5 transition-colors ${password.length >= MIN_PASSWORD_LENGTH ? 'text-green-400' : 'text-slate-600'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${password.length >= MIN_PASSWORD_LENGTH ? 'bg-green-400' : 'bg-slate-600'}`} />
                                    {t('auth.passwordMin')}
                                </span>
                                <span className={`text-xs font-bold flex items-center gap-1.5 transition-colors {/[a-zA-Z]/.test(password) ? 'text-green-400' : 'text-slate-600'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full {/[a-zA-Z]/.test(password) ? 'bg-green-400' : 'bg-slate-600'}`} />
                                    {t('auth.passwordLetter')}
                                </span>
                                <span className={`text-xs font-bold flex items-center gap-1.5 transition-colors {/[0-9]/.test(password) ? 'text-green-400' : 'text-slate-600'}`}>
                                    <span className={`w-1.5 h-1.5 rounded-full {/[0-9]/.test(password) ? 'bg-green-400' : 'bg-slate-600'}`} />
                                    {t('auth.passwordNumber')}
                                </span>
                            </div>
                        </div>
                        <input
                            type="password"
                            placeholder={t('auth.passwordConfirm')}
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
                            {isLoading ? t('common.processing') : t('auth.sendVerificationEmail')}
                        </button>
                    </div>
                </div>
            ) : (
                /* 기본 로그인 화면 */
                <div className="w-full flex flex-col items-center">
                    <div className="mb-12 text-center">
                        <h1 className="text-6xl font-extrabold italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">MyGym</h1>
                        <p className="mt-2 text-gray-400 font-medium tracking-wide uppercase italic">Level up your limits</p>
                    </div>

                    <div className="w-full lg:max-w-md space-y-4">
                        {session ? (
                            <div className="space-y-4 animate-fade-in w-full">
                                <div className="bg-slate-900/50 p-6 rounded-3xl border border-blue-500/20 text-center">
                                    <p className="text-slate-400 text-sm mb-1">{t('auth.welcome')}</p>
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
                                    {t('auth.switchAccount')}
                                </button>
                            </div>
                        ) : (
                            <>
                                <input
                                    type="email"
                                    placeholder={t('auth.email')}
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <input
                                    type="password"
                                    placeholder={t('auth.password')}
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
                                        {isLoading ? t('auth.loginLoading') : t('auth.login')}
                                    </button>
                                    <button
                                        onClick={() => { setIsSignup(true); setErrorMsg(''); }}
                                        className="flex-1 py-4 bg-slate-700 text-white font-bold rounded-xl active:scale-95 transition-all"
                                    >
                                        {t('auth.signup')}
                                    </button>
                                </div>
                                <button
                                    onClick={handleGoogleLogin}
                                    className="w-full py-4 bg-white text-slate-900 font-bold rounded-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                                >
                                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="G" />
                                    {t('auth.googleLogin')}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginScreen;
