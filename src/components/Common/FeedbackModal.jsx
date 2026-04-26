import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { supabase } from '../../api/supabase';

export default function FeedbackModal({ isOpen, onClose }) {
  const { t } = useTranslation();
  const [type, setType] = useState('건의');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setType('건의');
      setTitle('');
      setContent('');
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error(t('feedback.errorRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('send-feedback', {
        body: { type, title: title.trim(), content: content.trim() },
      });
      if (error) throw error;
      toast.success(t('feedback.success'));
      onClose();
    } catch {
      toast.error(t('feedback.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const typeOptions = [
    { value: '건의', label: t('feedback.typeSuggestion') },
    { value: '문의', label: t('feedback.typeInquiry') },
  ];

  return (
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg bg-slate-900 rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-white/5">
          <h2 className="text-lg font-black text-white break-keep">{t('feedback.title')}</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-white rounded-xl hover:bg-white/5 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-5 pb-8 sm:pb-6">
          {/* Type 선택 */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 break-keep">
              {t('feedback.typeLabel')}
            </label>
            <div className="flex gap-2">
              {typeOptions.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border break-keep ${
                    type === value
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800 text-slate-400 border-white/10 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 break-keep">
              {t('feedback.titleLabel')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('feedback.titlePlaceholder')}
              maxLength={100}
              className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all break-keep"
            />
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 break-keep">
              {t('feedback.contentLabel')}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('feedback.contentPlaceholder')}
              rows={5}
              maxLength={1000}
              className="w-full px-4 py-3 bg-slate-800 border border-white/10 rounded-xl text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500/50 transition-all resize-none break-keep"
            />
            <p className="text-right text-xs text-slate-600 mt-1">{content.length} / 1000</p>
          </div>

          {/* 전송 버튼 */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl transition-all text-sm active:scale-95 break-keep"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                {t('common.processing')}
              </span>
            ) : (
              t('feedback.submit')
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
