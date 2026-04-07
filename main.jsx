import React, { useState, useMemo, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './i18n';

console.log("MyGym App Initializing...");

/**
 * [Common Data: Exercise List]
 */
const EXERCISE_DATA = {
    'chest': {
        'free_weights': ['bench_press', 'incline_bench_press', 'dumbbell_fly'],
        'machine': ['chest_press_machine', 'pec_deck_fly'],
        'cable': ['cable_crossover']
    },
    'back_part': {
        'free_weights': [
            { name: 'one_arm_dumbbell_row', target: 'latissimus_dorsi', equipment: 'dumbbell', gifUrl: 'https://placehold.co/400x300/1f2937/ffffff?text=Dumbbell+Row' },
            { name: 'barbell_row', target: 'entire_back', equipment: 'barbell', gifUrl: 'https://placehold.co/400x300/1f2937/ffffff?text=Barbell+Row' },
            { name: 'deadlift', target: 'erector_spinae', equipment: 'barbell', gifUrl: 'https://placehold.co/400x300/1f2937/ffffff?text=Deadlift' },
            { name: 'lateral_raise', target: 'posterior_deltoid', equipment: 'dumbbell', gifUrl: 'https://placehold.co/400x300/1f2937/ffffff?text=Lateral+Raise' }
        ],
        'machine': [
            { name: 'lat_pulldown', target: 'latissimus_dorsi', equipment: 'machine', gifUrl: 'https://placehold.co/400x300/1f2937/ffffff?text=Lat+Pulldown' },
            { name: 'front_row', target: 'middle_back', equipment: 'machine', gifUrl: 'https://placehold.co/400x300/1f2937/ffffff?text=Front+Row' },
            { name: 'low_row', target: 'lower_back', equipment: 'machine', gifUrl: 'https://placehold.co/400x300/1f2937/ffffff?text=Low+Row' },
            { name: 'seated_row', target: 'entire_back', equipment: 'machine', gifUrl: 'https://placehold.co/400x300/1f2937/ffffff?text=Seated+Row' }
        ],
        'cable': [
            { name: 'arm_pulldown', target: 'latissimus_dorsi', equipment: 'cable', gifUrl: 'https://placehold.co/400x300/1f2937/ffffff?text=Arm+Pulldown' }
        ]
    },
    'legs': {
        'free_weights': ['back_squat', 'lunge', 'romanian_deadlift'],
        'machine': ['leg_press', 'leg_extension', 'leg_curl'],
        'cable': []
    },
    'shoulders': {
        'free_weights': ['shoulder_press', 'side_lateral_raise', 'bent_over_lateral_raise'],
        'machine': ['shoulder_press_machine'],
        'cable': ['cable_face_pull']
    },
    'arms': {
        'free_weights': ['barbell_curl', 'dumbbell_curl', 'lying_triceps_extension'],
        'machine': ['arm_curl_machine'],
        'cable': ['push_down']
    }
};

/**
 * [Common: Exercise Detail Modal]
 */
const ExerciseModal = ({ exercise, onClose }) => {
    const { t } = useTranslation();
    if (!exercise) return null;
    
    const data = typeof exercise === 'object' ? {
        ...exercise,
        name: t(exercise.name),
        target: t(exercise.target),
        equipment: t(exercise.equipment)
    } : { 
        name: t(exercise), 
        target: t('default_target'), 
        equipment: t('equipment_label'),
        gifUrl: 'https://placehold.co/400x300/1f2937/ffffff?text=Exercise+GIF'
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-scale-up">
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 p-2 bg-slate-950/50 hover:bg-slate-950 text-white rounded-full transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                
                <img src={data.gifUrl} alt={data.name} className="w-full h-64 object-cover bg-slate-800" />
                
                <div className="p-8">
                    <div className="mb-6">
                        <h3 className="text-3xl font-black text-white italic tracking-tighter mb-2">{data.name}</h3>
                        <div className="flex gap-2">
                            <span className="bg-red-500/20 text-red-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-red-500/20">
                                {data.target}
                            </span>
                            <span className="bg-blue-500/20 text-blue-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-blue-500/20">
                                {data.equipment}
                            </span>
                        </div>
                    </div>
                    
                    <div className="space-y-4 pt-6 border-t border-slate-800">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t('my_best_record')}</h4>
                        <div className="py-8 text-center bg-slate-950/30 rounded-2xl border border-slate-800 border-dashed">
                            <p className="text-slate-500 italic text-sm">{t('no_data_yet')}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * [Common: Exercise Selector]
 */
const ExerciseSelector = ({ selection, setSelection, onExerciseSelect }) => {
    const { t } = useTranslation();
    const [modalExercise, setModalExercise] = useState(null);

    const handlePartClick = (p) => {
        setSelection({ part: p, type: '', exercise: '' });
    };

    const handleTypeClick = (tKey) => {
        setSelection({ ...selection, type: tKey, exercise: '' });
    };

    const handleExerciseClick = (exName) => {
        setSelection({ ...selection, exercise: exName });
        if (onExerciseSelect) onExerciseSelect(exName);
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block px-1">{t('step1_select_part')}</label>
                <div className="grid grid-cols-3 gap-2">
                    {Object.keys(EXERCISE_DATA).map(p => (
                        <button 
                            key={p} 
                            onClick={() => handlePartClick(p)} 
                            className={`py-3 rounded-xl font-bold text-sm transition-all ${selection.part === p ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                        >
                            {t(p)}
                        </button>
                    ))}
                </div>
            </div>

            {selection.part && (
                <div className="animate-fade-in">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 block px-1">{t('step2_select_type')}</label>
                    <div className="flex gap-2">
                        {Object.keys(EXERCISE_DATA[selection.part]).map(typeKey => (
                            <button 
                                key={typeKey} 
                                onClick={() => handleTypeClick(typeKey)} 
                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${selection.type === typeKey ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                            >
                                {t(typeKey)}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {selection.type && (
                <div className="animate-fade-in space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 px-1">{t('step3_select_exercise')}</label>
                    {(EXERCISE_DATA[selection.part][selection.type] || []).map((ex, idx) => {
                        const exKey = typeof ex === 'object' ? ex.name : ex;
                        const exName = t(exKey);
                        const exTarget = typeof ex === 'object' ? t(ex.target) : t('default_target');
                        const exGif = typeof ex === 'object' ? ex.gifUrl : 'https://placehold.co/400x300/1f2937/ffffff?text=Exercise+GIF';
                        
                        return (
                            <div 
                                key={idx}
                                onClick={() => handleExerciseClick(exKey)}
                                className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all border ${selection.exercise === exKey ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <img src={exGif} className="w-12 h-12 rounded-full object-cover bg-slate-800 border border-slate-700" alt={exName} />
                                    <div>
                                        <p className="text-sm font-bold text-white leading-tight">{exName}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">{exTarget}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setModalExercise(ex); }}
                                    className="p-2 text-slate-500 hover:text-white transition-colors group"
                                >
                                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
            
            <ExerciseModal exercise={modalExercise} onClose={() => setModalExercise(null)} />
        </div>
    );
};

/**
 * [Common: Language Toggle Button]
 */
const LanguageToggle = () => {
    const { t, i18n } = useTranslation();
    const currentLang = i18n.language;

    return (
        <button 
            onClick={() => i18n.changeLanguage(currentLang === 'ko' ? 'en' : 'ko')}
            className="flex items-center gap-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-full transition-all active:scale-95 group shadow-lg shadow-black/20"
        >
            <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                {t('lang_toggle')}
            </span>
        </button>
    );
};

/**
 * [Common: Back Button Component]
 */
const BackButton = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    return (
        <button 
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group"
        >
            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">{t('back')}</span>
        </button>
    );
};

/**
 * [Screen 1: Login and Sign Up]
 */
const LoginScreen = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [isVerified, setIsVerified] = useState(false);

    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');

    const handleVerify = () => {
        if (!email) {
            alert(t('alert_input_email'));
            return;
        }
        alert(t('alert_verify_sent'));
        setIsVerified(true);
    };

    const handleSignupComplete = () => {
        if (!isVerified) {
            alert(t('alert_verify_required'));
            return;
        }
        if (password !== passwordConfirm) {
            alert(t('alert_pw_mismatch'));
            return;
        }
        alert(t('alert_signup_success'));
        setIsSignup(false);
    };

    if (isSignup) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen px-6 py-12 animate-fade-in bg-slate-950 relative">
                <div className="absolute top-6 right-6"><LanguageToggle /></div>
                <div className="w-full max-w-md space-y-8">
                    <button 
                        onClick={() => setIsSignup(false)}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4 group"
                    >
                        <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                        </svg>
                        <span className="font-medium">{t('back')}</span>
                    </button>
                    <div className="text-center">
                        <h2 className="text-4xl font-black italic tracking-tighter text-white uppercase">{t('signup')}</h2>
                        <p className="mt-2 text-slate-400 font-medium">{t('signup_desc')}</p>
                    </div>
                    <div className="space-y-6 bg-slate-900/50 p-8 rounded-3xl border border-slate-800 shadow-2xl">
                        <button
                            onClick={() => alert(t('alert_google_login_beta'))}
                            className="w-full py-3 bg-white hover:bg-gray-100 text-slate-900 font-bold rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-white/5"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            {t('google_login')}
                        </button>
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-900/50 px-2 text-slate-500 font-bold">{t('or_separator')}</span></div>
                        </div>
                        <div className="space-y-4">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">{t('account_info_required')}</label>
                            <div className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder={t('id_email_placeholder')}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                                />
                                <button 
                                    onClick={handleVerify}
                                    className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm transition-all whitespace-nowrap active:scale-95"
                                >
                                    {t('verify_button')}
                                </button>
                            </div>
                            <input
                                type="password"
                                placeholder={t('pw_placeholder')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                            />
                            <input
                                type="password"
                                placeholder={t('pw_confirm_placeholder')}
                                value={passwordConfirm}
                                onChange={(e) => setPasswordConfirm(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                            />
                        </div>
                        <div className="space-y-4 pt-6 border-t border-slate-800">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block mb-1">{t('ai_coaching_info_optional')}</label>
                                <p className="text-[11px] text-slate-400 mb-4">{t('ai_coaching_info_desc')}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <input 
                                    type="number" 
                                    placeholder={t('age_placeholder')}
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all" 
                                />
                                <select 
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                    className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                                >
                                    <option value="">{t('gender_placeholder')}</option>
                                    <option value="male">{t('male')}</option>
                                    <option value="female">{t('female')}</option>
                                </select>
                                <input 
                                    type="number" 
                                    placeholder={t('height_placeholder')}
                                    value={height}
                                    onChange={(e) => setHeight(e.target.value)}
                                    className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all" 
                                />
                                <input 
                                    type="number" 
                                    placeholder={t('weight_placeholder')}
                                    value={weight}
                                    onChange={(e) => setWeight(e.target.value)}
                                    className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all" 
                                />
                            </div>
                        </div>
                        <div className="pt-2">
                            <button
                                onClick={handleSignupComplete}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all mb-4"
                            >
                                {t('signup_complete_button')}
                            </button>
                            <button
                                onClick={() => setIsSignup(false)}
                                className="w-full text-sm text-slate-500 hover:text-white transition-colors py-2"
                            >
                                {t('already_have_account')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-6 animate-fade-in relative bg-slate-950">
            <div className="absolute top-6 right-6"><LanguageToggle /></div>
            <div className="mb-12 text-center">
                <h1 className="text-6xl font-extrabold italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600">
                    {t('welcome_title')}
                </h1>
                <p className="mt-2 text-gray-400 font-medium tracking-wide uppercase">{t('welcome_subtitle')}</p>
            </div>
            <div className="w-full max-w-sm space-y-4">
                <div className="space-y-2">
                    <input
                        type="text"
                        placeholder={t('id_placeholder')}
                        className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                    />
                    <input
                        type="password"
                        placeholder={t('pw_placeholder')}
                        className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-500 transition-all"
                    />
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                    >
                        {t('login')}
                    </button>
                    <button
                        onClick={() => setIsSignup(true)}
                        className="flex-1 py-4 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl active:scale-95 transition-all"
                    >
                        {t('signup')}
                    </button>
                </div>
                <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-slate-950 px-2 text-slate-600 font-bold">{t('or_separator')}</span></div>
                </div>
                <button
                    onClick={() => alert(t('alert_google_login_beta'))}
                    className="w-full py-4 bg-white hover:bg-gray-100 text-slate-900 font-bold rounded-xl flex items-center justify-center gap-3 transition-all active:scale-95"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    {t('google_login')}
                </button>
            </div>
        </div>
    );
};

/**
 * [Screen: Routine Detail]
 */
const WorkoutDetailScreen = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const data = location.state?.data || { name: '?', part: 'no_record' };
    const dummyRecords = [
        { name: 'deadlift', sets: 3, reps: 15, weight: 100 },
        { name: 'lat_pulldown', sets: 4, reps: 12, weight: 60 },
        { name: 'barbell_row', sets: 3, reps: 10, weight: 40 },
    ];
    return (
        <div className="p-8 md:p-12 max-w-4xl mx-auto animate-fade-in bg-slate-950 min-h-screen relative">
            <div className="absolute top-6 right-6"><LanguageToggle /></div>
            <BackButton />
            <div className="mb-10">
                <span className="px-3 py-1 bg-blue-600 text-[10px] font-bold rounded-full uppercase tracking-widest text-white mb-2 inline-block">
                    {data.name} {t('day_record')}
                </span>
                <h2 className="text-4xl font-black italic tracking-tighter text-white">
                    {t(data.part)} {t('training_details')}
                </h2>
            </div>
            <div className="space-y-4">
                {dummyRecords.map((record, i) => (
                    <div key={i} className="bg-slate-800/50 border border-slate-700 p-6 rounded-2xl flex justify-between items-center group hover:border-blue-500/50 transition-colors">
                        <div>
                            <h3 className="text-xl font-bold text-white mb-1">{t(record.name)}</h3>
                            <p className="text-slate-400 text-sm font-medium">{record.sets} SETS × {record.reps} REPS</p>
                        </div>
                        <div className="text-right">
                            <span className="text-2xl font-black text-blue-500 italic">{record.weight}kg</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * [Screen: Routine Record]
 */
const WorkoutSetupScreen = () => {
    const { t } = useTranslation();
    const [step, setStep] = useState(1);
    const [selection, setSelection] = useState({ part: '', type: '', exercise: '' });
    const [numSets, setNumSets] = useState('');
    const [setsData, setSetsData] = useState([]);
    const [addedExercises, setAddedExercises] = useState([]);
    const [editingId, setEditingId] = useState(null);

    const handleNumSetsChange = (e) => {
        const val = parseInt(e.target.value) || 0;
        setNumSets(e.target.value);
        if (val > 0) {
            setSetsData(prev => {
                const newData = new Array(val).fill(null).map((_, i) => prev[i] || { weight: '', reps: '' });
                return newData;
            });
        } else {
            setSetsData([]);
        }
    };

    const handleSetDataChange = (index, field, value) => {
        const newData = [...setsData];
        newData[index] = { ...newData[index], [field]: value };
        setSetsData(newData);
    };

    const isRecordEnabled = useMemo(() => {
        const nSets = parseInt(numSets);
        const allSetsFilled = setsData.length > 0 && setsData.length === nSets && setsData.every(s => s.weight !== '' && s.reps !== '' && parseFloat(s.weight) >= 0 && parseInt(s.reps) > 0);
        return nSets > 0 && allSetsFilled && selection.exercise !== '';
    }, [numSets, setsData, selection.exercise]);

    const handleAddOrUpdateExercise = () => {
        if (!isRecordEnabled) return;
        const newEntry = { ...selection, sets: numSets, setsData: [...setsData], id: editingId || Date.now() };
        if (editingId) {
            setAddedExercises(prev => prev.map(ex => ex.id === editingId ? newEntry : ex));
            setEditingId(null);
        } else {
            setAddedExercises([...addedExercises, newEntry]);
        }
        setNumSets('');
        setSetsData([]);
        setStep(1);
        setSelection({ part: '', type: '', exercise: '' });
    };

    const handleDelete = (id) => {
        if (confirm(t('confirm_delete_routine'))) {
            setAddedExercises(prev => prev.filter(ex => ex.id !== id));
        }
    };

    const handleEdit = (ex) => {
        setSelection({ part: ex.part, type: ex.type, exercise: ex.exercise });
        setNumSets(ex.sets);
        setSetsData([...ex.setsData]);
        setEditingId(ex.id);
        setStep(4);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="p-8 md:p-12 max-w-4xl mx-auto animate-fade-in bg-slate-950 min-h-screen relative">
            <div className="absolute top-6 right-6"><LanguageToggle /></div>
            <BackButton />
            <div className="mb-8">
                <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter underline decoration-blue-500 decoration-4 underline-offset-8">
                    {t('routine_record_title')}
                </h2>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <ExerciseSelector selection={selection} setSelection={setSelection} onExerciseSelect={() => setStep(4)} />
                    
                    {step >= 4 && (
                        <div className="animate-fade-in space-y-6 bg-slate-800/30 p-6 rounded-2xl border border-slate-700">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block tracking-tighter">SETS</label>
                                <input type="number" value={numSets} onChange={handleNumSetsChange} className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl text-white text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0" />
                            </div>
                            {setsData.length > 0 && (
                                <div className="space-y-3 animate-slide-down">
                                    <label className="text-[10px] font-bold text-blue-500 uppercase block tracking-widest">{t('sets_detail_record')}</label>
                                    <div className="space-y-2">
                                        {setsData.map((s, idx) => (
                                            <div key={idx} className="flex items-center gap-3 bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                                                <span className="text-xs font-bold text-slate-600 w-8">{idx + 1}S</span>
                                                <div className="flex-1 flex gap-2">
                                                    <input type="number" value={s.weight} onChange={(e) => handleSetDataChange(idx, 'weight', e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white text-right font-bold focus:border-blue-500 outline-none text-sm" placeholder="KG" />
                                                    <input type="number" value={s.reps} onChange={(e) => handleSetDataChange(idx, 'reps', e.target.value)} className="w-full bg-slate-900 border border-slate-700 p-2 rounded-lg text-white text-right font-bold focus:border-indigo-500 outline-none text-sm" placeholder="REPS" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <button onClick={handleAddOrUpdateExercise} disabled={!isRecordEnabled} className={`w-full py-4 font-black rounded-xl italic tracking-tighter transition-all ${isRecordEnabled ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>{editingId ? t('edit_complete') : t('record_button')}</button>
                        </div>
                    )}
                </div>
                <div className="bg-slate-900/50 rounded-3xl border border-slate-800 p-6">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2"><span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>{t('currently_recorded_routines')} ({addedExercises.length})</h3>
                    <div className="space-y-4">
                        {addedExercises.length === 0 ? (<p className="text-slate-600 text-center py-12 italic text-sm">{t('no_recorded_routines')}</p>) : (addedExercises.map((ex, idx) => (
                            <div key={ex.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 group relative">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <span className="text-[10px] font-bold text-blue-400 block uppercase">{t(ex.part)} / {t(ex.type)}</span>
                                        <span className="font-bold text-white text-lg">{t(ex.exercise)}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEdit(ex)} className="p-2 bg-slate-700 hover:bg-blue-600 text-white rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                                        <button onClick={() => handleDelete(ex.id)} className="p-2 bg-slate-700 hover:bg-rose-600 text-white rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {ex.setsData.map((s, i) => (
                                        <div key={i} className="px-3 py-1 bg-slate-900 rounded-lg border border-slate-700 text-[11px] flex flex-col items-center min-w-[50px]">
                                            <span className="text-slate-500 text-[9px] mb-1">{i+1}S</span>
                                            <span className="text-white font-bold">{s.weight}kg</span>
                                            <span className="text-indigo-400 font-medium">{s.reps}R</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 text-right"><span className="text-xs font-bold text-slate-500 uppercase">Total {ex.sets} Sets</span></div>
                            </div>
                        )))}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * [Screen: Routine Compose]
 */
const WorkoutPlanScreen = () => {
    const { t } = useTranslation();
    const [planList, setPlanList] = useState([]);
    const [selection, setSelection] = useState({ part: '', type: '', exercise: '' });
    const [recordingId, setRecordingId] = useState(null);
    const [tempSets, setTempSets] = useState([{ weight: '', reps: '' }]);

    const addExerciseToPlan = () => {
        if (!selection.exercise) return;
        const newEntry = {
            id: Date.now(),
            ...selection,
            sets: [],
            isCompleted: false
        };
        setPlanList([...planList, newEntry]);
        setSelection({ ...selection, exercise: '' });
    };

    const startRecording = (id) => {
        const item = planList.find(ex => ex.id === id);
        setRecordingId(id);
        setTempSets(item.sets.length > 0 ? [...item.sets] : [{ weight: '', reps: '' }]);
    };

    const handleSetChange = (index, field, value) => {
        const nextSets = [...tempSets];
        nextSets[index] = { ...nextSets[index], [field]: value };
        setTempSets(nextSets);
    };

    const addSetField = () => {
        setTempSets([...tempSets, { weight: '', reps: '' }]);
    };

    const removeSetField = (index) => {
        setTempSets(tempSets.filter((_, i) => i !== index));
    };

    const finishRecording = () => {
        setPlanList(prev => prev.map(ex => 
            ex.id === recordingId 
            ? { ...ex, sets: [...tempSets], isCompleted: true } 
            : ex
        ));
        setRecordingId(null);
    };

    const deleteFromPlan = (id) => {
        setPlanList(planList.filter(ex => ex.id !== id));
        if (recordingId === id) setRecordingId(null);
    };

    return (
        <div className="p-6 md:p-12 max-w-6xl mx-auto animate-fade-in bg-slate-950 min-h-screen relative mb-20">
            <div className="absolute top-6 right-6"><LanguageToggle /></div>
            <BackButton />
            <div className="mb-8">
                <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter underline decoration-indigo-500 decoration-4 underline-offset-8">
                    {t('routine_compose_title')}
                </h2>
                <p className="text-slate-400 mt-2 text-sm">{t('routine_compose_desc')}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Left: Add Exercise Area */}
                <div className="lg:col-span-1 space-y-6 bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>{t('add_exercise')}
                    </h3>
                    
                    <ExerciseSelector selection={selection} setSelection={setSelection} />

                    <button 
                        onClick={addExerciseToPlan}
                        disabled={!selection.exercise}
                        className={`w-full py-3 rounded-xl font-black italic uppercase tracking-tighter transition-all ${selection.exercise ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-600'}`}
                    >
                        {t('add_to_list')}
                    </button>
                </div>

                {/* Center: Today's List */}
                <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>{t('todays_list')} ({planList.length})
                    </h3>

                    {planList.length === 0 ? (
                        <div className="py-20 text-center bg-slate-900/30 rounded-3xl border border-slate-800 border-dashed">
                            <p className="text-slate-500 italic text-sm">{t('add_exercise_first')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {planList.map((item) => (
                                <div key={item.id} className={`bg-slate-900 border transition-all rounded-2xl overflow-hidden ${recordingId === item.id ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-slate-800'}`}>
                                    <div className="p-5 flex justify-between items-center">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[9px] font-black px-2 py-0.5 bg-slate-800 text-slate-400 rounded uppercase">{t(item.part)}</span>
                                                {item.isCompleted && <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded uppercase tracking-tighter">{t('completed')}</span>}
                                            </div>
                                            <h4 className={`font-bold text-lg ${item.isCompleted ? 'text-slate-500' : 'text-white'}`}>{t(item.exercise)}</h4>
                                            {item.sets.length > 0 && (
                                                <p className="text-[11px] text-indigo-400 font-bold mt-1 uppercase tracking-widest">{item.sets.length} Sets Completed</p>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            {!item.isCompleted ? (
                                                <button 
                                                    onClick={() => startRecording(item.id)}
                                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black italic rounded-lg transition-all active:scale-95"
                                                >
                                                    {t('record_button')}
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => startRecording(item.id)}
                                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-black italic rounded-lg transition-all"
                                                >
                                                    {t('edit')}
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => deleteFromPlan(item.id)}
                                                className="p-2 text-slate-600 hover:text-rose-500 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Dynamic Record Form */}
                                    {recordingId === item.id && (
                                        <div className="bg-slate-800/50 p-5 border-t border-slate-700 animate-slide-down">
                                            <div className="space-y-3 mb-4">
                                                {tempSets.map((s, idx) => (
                                                    <div key={idx} className="flex items-center gap-3">
                                                        <span className="text-[10px] font-bold text-slate-500 w-6">{idx + 1}S</span>
                                                        <input 
                                                            type="number" 
                                                            placeholder="KG" 
                                                            value={s.weight}
                                                            onChange={(e) => handleSetChange(idx, 'weight', e.target.value)}
                                                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm font-bold focus:outline-none focus:border-indigo-500"
                                                        />
                                                        <input 
                                                            type="number" 
                                                            placeholder="REPS" 
                                                            value={s.reps}
                                                            onChange={(e) => handleSetChange(idx, 'reps', e.target.value)}
                                                            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-2 text-white text-sm font-bold focus:outline-none focus:border-indigo-500"
                                                        />
                                                        <button onClick={() => removeSetField(idx)} className="text-slate-600 hover:text-rose-500">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={addSetField}
                                                    className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white text-[11px] font-bold rounded-lg transition-all"
                                                >
                                                    {t('add_set')}
                                                </button>
                                                <button 
                                                    onClick={finishRecording}
                                                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/20"
                                                >
                                                    {t('record_complete')}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

/**
 * [Screen: AI Coach]
 */
const AIRecommendationScreen = () => {
    const { t } = useTranslation();
    return (
        <div className="p-8 md:p-12 max-w-4xl mx-auto animate-fade-in bg-slate-950 min-h-screen relative">
            <div className="absolute top-6 right-6"><LanguageToggle /></div>
            <BackButton />
            <div className="bg-gradient-to-br from-indigo-900/40 to-blue-900/40 border border-blue-500/30 rounded-[2rem] p-8 md:p-12 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10"><svg className="w-32 h-32 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" /></svg></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6"><div className="px-3 py-1 bg-blue-500 text-[10px] font-black text-white rounded-md tracking-widest animate-pulse">AI ANALYZING...</div></div>
                    <h2 className="text-4xl md:text-5xl font-black italic tracking-tighter text-white mb-8 leading-tight">TODAY'S <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400 underline decoration-blue-500/50">SMART PICK</span></h2>
                    <div className="bg-slate-900/60 backdrop-blur-md border border-white/5 p-6 rounded-2xl mb-10"><p className="text-slate-200 text-lg leading-relaxed font-medium">{t('ai_smart_pick_desc', { part1: t('back_part'), part2: t('chest') })}</p></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[{ name: 'back_squat', desc: t('back_squat_desc'), diff: 'Hard' }, { name: 'romanian_deadlift', desc: t('romanian_deadlift_desc'), diff: 'Med' }].map((rec, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-5 rounded-2xl flex justify-between items-center group hover:bg-white/10 transition-all cursor-pointer">
                                <div><h4 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{t(rec.name)}</h4><p className="text-slate-400 text-xs mt-1">{rec.desc}</p></div>
                                <span className="w-8 h-8 rounded-full border border-blue-500/50 flex items-center justify-center text-[10px] font-black text-blue-400">{rec.diff}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * [Common: Monthly Calendar Component]
 */
const MonthlyCalendar = () => {
    const { t } = useTranslation();
    const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const lastDateOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const calendarDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
    for (let i = 1; i <= lastDateOfMonth; i++) calendarDays.push(i);

    const completedDates = [3, 12, 24];

    return (
        <div className="mt-8 md:mt-10 p-5 md:p-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-md md:text-lg font-bold text-white uppercase tracking-tighter">
                    {currentMonth + 1}{t('month_label')} {t('training_calendar')}
                </h3>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{t('workout_day')}</span>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-1 md:gap-2">
                {daysOfWeek.map(day => (<div key={day} className="text-center text-[10px] md:text-xs font-black text-slate-500 py-2 uppercase">{day}</div>))}
                {calendarDays.map((date, idx) => (
                    <div key={idx} className="aspect-square flex items-center justify-center relative group">
                        {date && (
                            <>
                                <span className={`relative z-10 text-[11px] md:text-sm font-bold ${completedDates.includes(date) ? 'text-white' : 'text-slate-400'}`}>{date}</span>
                                {completedDates.includes(date) && <div className="absolute inset-0 m-auto w-7 h-7 md:w-8 md:h-8 bg-red-500 rounded-full shadow-lg shadow-red-500/40 animate-pulse-slow"></div>}
                                {date === today.getDate() && !completedDates.includes(date) && <div className="absolute inset-0 m-auto w-7 h-7 md:w-8 md:h-8 border border-blue-500/50 rounded-full"></div>}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

/**
 * [Screen 2: Main Dashboard]
 */
const DashboardScreen = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const recentDays = useMemo(() => {
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const result = [];
        const today = new Date();
        for (let i = 5; i >= 1; i--) {
            const d = new Date(); d.setDate(today.getDate() - i);
            result.push({ 
                name: days[d.getDay()], 
                part: ['chest', 'legs', 'rest', 'shoulders', 'back_part'][Math.floor(Math.random() * 5)] 
            });
        }
        return result;
    }, []);

    const getBadgeColor = (part) => {
        switch (part) {
            case 'chest': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
            case 'legs': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
            case 'shoulders': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
            case 'back_part': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    return (
        <div className="flex flex-col md:flex-row min-h-screen animate-fade-in overflow-x-hidden relative bg-slate-950">
            <div className="absolute top-6 right-6 z-20"><LanguageToggle /></div>
            <div className="w-full md:w-1/2 p-6 md:p-12 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-950 flex flex-col justify-center">
                <div className="mb-8 md:mb-10">
                    <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-white"><span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>{t('recent_routine')}</h2>
                    <p className="text-slate-400 text-xs md:text-sm mt-1">{t('recent_routine_desc')}</p>
                </div>
                <div className="grid grid-cols-5 gap-2 md:gap-3">
                    {recentDays.map((day, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-3 md:gap-4 group">
                            <span className="text-slate-500 font-semibold text-[10px] md:text-sm">{day.name}</span>
                            <div onClick={() => navigate('/routine-detail', { state: { data: day } })} className={`w-full py-2.5 md:py-3 px-1 md:px-2 rounded-lg md:rounded-xl border text-center text-[9px] md:text-xs font-bold cursor-pointer transition-all active:scale-90 hover:scale-105 ${getBadgeColor(day.part)}`}>{t(day.part)}</div>
                        </div>
                    ))}
                </div>
                <MonthlyCalendar />
            </div>
            <div className="w-full md:w-1/2 flex flex-col h-auto md:h-screen">
                <button onClick={() => navigate('/routine-record')} className="h-[220px] md:flex-1 group relative overflow-hidden bg-slate-900 flex flex-col items-center justify-center transition-all hover:bg-slate-800 border-b border-slate-800 md:border-b-0">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-600/30 group-hover:rotate-12 transition-transform"><svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></div>
                        <span className="text-lg md:text-xl font-black italic text-white tracking-tighter">{t('routine_record_title')}</span>
                        <p className="text-slate-400 text-[10px] md:text-xs mt-1 uppercase">Routine Record</p>
                    </div>
                </button>
                <button onClick={() => navigate('/routine-compose')} className="h-[220px] md:flex-1 group relative overflow-hidden bg-indigo-950 flex flex-col items-center justify-center transition-all hover:bg-indigo-950 border-b border-slate-800 md:border-b-0">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?q=80&w=800')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-indigo-600/30 group-hover:rotate-6 transition-transform"><svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg></div>
                        <span className="text-lg md:text-xl font-black italic text-white tracking-tighter">{t('routine_compose_title')}</span>
                        <p className="text-slate-400 text-[10px] md:text-xs mt-1 uppercase">Routine Compose</p>
                    </div>
                </button>
                <button onClick={() => navigate('/ai-coach')} className="h-[220px] md:flex-1 group relative overflow-hidden bg-blue-700 flex flex-col items-center justify-center transition-all hover:bg-blue-600">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=800')] bg-cover bg-center group-hover:scale-110 transition-transform duration-700"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-12 h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-3 border border-white/30 group-hover:-rotate-12 transition-transform"><svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></div>
                        <span className="text-lg md:text-xl font-black italic text-white tracking-tighter">{t('ai_coach')}</span>
                        <p className="text-blue-100 text-[10px] md:text-xs mt-1 uppercase">Ai Coach</p>
                    </div>
                </button>
            </div>
        </div>
    );
};

const App = () => {
    return (
        <BrowserRouter>
            <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-blue-500/30 font-sans">
                <Routes>
                    <Route path="/" element={<LoginScreen />} />
                    <Route path="/dashboard" element={<DashboardScreen />} />
                    <Route path="/routine-detail" element={<WorkoutDetailScreen />} />
                    <Route path="/routine-record" element={<WorkoutSetupScreen />} />
                    <Route path="/routine-compose" element={<WorkoutPlanScreen />} />
                    <Route path="/ai-coach" element={<AIRecommendationScreen />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />);
