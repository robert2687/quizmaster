
import React from 'react';
import { useTranslation } from 'react-i18next';

interface LoadingSpinnerProps {
  message?: string; // This can be kept for specific non-translatable dynamic messages if ever needed
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message }) => {
  const { t } = useTranslation();
  const displayMessage = message || t('loadingMessageDefault');

  return (
    <div className="flex flex-col items-center justify-center p-10 text-center">
      <svg className="animate-spin h-12 w-12 text-purple-400 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <p className="text-xl font-semibold text-slate-300">{displayMessage}</p>
      <p className="text-sm text-slate-400">{t('pleaseWait')}</p>
    </div>
  );
};

export default LoadingSpinner;
