import React from 'react';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'betaModalShown';

export const clearBetaModalFlag = () => sessionStorage.removeItem(STORAGE_KEY);
export const shouldShowBetaModal = () => !sessionStorage.getItem(STORAGE_KEY);

export default function BetaNoticeModal({ isOpen, onClose }) {
  const { t } = useTranslation();

  const handleConfirm = () => {
    sessionStorage.setItem(STORAGE_KEY, 'true');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-7 pb-2">
          <h2 className="text-xl font-black text-white break-keep leading-snug">
            {t('beta.title')}
          </h2>
        </div>

        {/* 공지사항 */}
        <div className="px-6 pt-4 pb-2">
          <ul className="flex flex-col gap-2.5">
            {(t('beta.notices', { returnObjects: true })).map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300 break-keep leading-relaxed">
                <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-slate-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* 강조 섹션 */}
        <div className="mx-6 mt-4 mb-6 rounded-2xl bg-blue-950/60 border border-blue-500/20 p-4">
          <p className="text-sm font-black text-blue-300 break-keep mb-2">
            {t('beta.highlightTitle')}
          </p>
          <p className="text-sm text-slate-300 break-keep leading-relaxed whitespace-pre-line">
            {t('beta.highlightContent')}
          </p>
        </div>

        {/* 확인 버튼 */}
        <div className="px-6 pb-7">
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-2xl transition-all text-sm active:scale-95 break-keep"
          >
            {t('beta.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
