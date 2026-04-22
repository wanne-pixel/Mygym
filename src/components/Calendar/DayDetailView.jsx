import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../api/supabase';
import { PART_MAP } from '../../constants/exerciseConstants';
import { getLocalizedNameByKo, BODY_PART_I18N } from '../../utils/exerciseUtils';

const DayDetailView = ({ date, onBack, onGoToRoutine, isMobile }) => {
    const { t, i18n } = useTranslation();
    const [logs, setLogs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchLogs = async () => {
        setIsLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data, error } = await supabase.from('workout_logs')
                .select('*')
                .eq('user_id', user.id)
                .gte('created_at', `${date}T00:00:00`)
                .lte('created_at', `${date}T23:59:59`)
                .order('created_at', { ascending: true });
            if (error) throw error;
            setLogs(data || []);
        } catch (e) { console.error(e); } finally { setIsLoading(false); }
    };

    useEffect(() => { fetchLogs(); }, [date]);

    const handleDelete = async (id) => {
        if (!confirm(t('dayDetail.deleteConfirm'))) return;
        const { error } = await supabase.from('workout_logs').delete().eq('id', id);
        if (!error) fetchLogs();
    };

    return (
        <div className="animate-fade-in">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 group">
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                <span className="font-bold">{t('dayDetail.backToCalendar')}</span>
            </button>
            <h2 className="text-2xl font-black italic text-white mb-6">{date}{t('dayDetail.trainingSuffix')}</h2>
            <div className="space-y-4">
                {isLoading ? (
                    <div className="text-center text-slate-500 italic py-20">{t('common.loading')}</div>
                ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
                                <svg className="w-10 h-10 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                            </div>
                            <p className="text-slate-500 font-bold text-sm">{t('dayDetail.noRecord')}</p>
                        </div>
                        <button onClick={onGoToRoutine} className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl italic text-sm active:scale-95 transition-all shadow-lg shadow-blue-600/20">
                            {t('dayDetail.addExercise')}
                        </button>
                    </div>
                ) : (
                    <>
                        {logs.map(log => (
                            <div key={log.id} className={`bg-slate-900/40 border border-white/5 p-6 rounded-[1.5rem] relative overflow-hidden ${isMobile ? 'mb-3' : 'mb-4'}`}>
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-600"></div>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <span className="bg-blue-600 text-[8px] font-black px-2 py-0.5 rounded-full uppercase text-white mb-1 inline-block">{t(BODY_PART_I18N[log.part] || log.part, { defaultValue: log.part })}</span>
                                        <h3 className={`font-black italic text-white uppercase tracking-tighter ${isMobile ? 'text-lg' : 'text-xl'}`}>{getLocalizedNameByKo(log.exercise, i18n.language)}</h3>
                                    </div>
                                    <button onClick={() => handleDelete(log.id)} className="p-2 bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white rounded-lg transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                </div>
                                <div className="space-y-1">
                                    {log.sets_data?.map((s, idx) => (
                                        <div key={idx} className={`flex justify-between py-1 px-3 bg-slate-950/50 rounded-lg font-bold ${isMobile ? 'text-sm' : 'text-xs'}`}>
                                            <span className="text-slate-500">{idx + 1} {t('dayDetail.setLabel')}</span>
                                            <span className="text-white">
                                                {s.isDropSet ? s.dropKgs?.filter(k=>k!=='').join(' › ') + ' kg' : s.kg ? `${s.kg}kg` : ''}{s.reps ? ` × ${s.reps}${t('dayDetail.repsUnit')}` : ''}{s.level ? `${t('dayDetail.levelPrefix')}${s.level}` : ''}{s.minutes ? ` ${s.minutes}${t('dayDetail.minuteUnit')}` : ''}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                        <button onClick={onGoToRoutine} className="w-full py-3 border border-dashed border-blue-600/50 text-blue-400 text-sm font-bold rounded-2xl hover:border-blue-500 transition-all active:scale-[0.98]">
                            {t('dayDetail.addMore')}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default DayDetailView;
