
import React from 'react';
import { useTranslation } from 'react-i18next';
import RetryIcon from './icons/RetryIcon';

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message, onRetry }) => {
  const { t } = useTranslation();
  return (
    <div className="w-full max-w-md p-6 md:p-8 bg-slate-800 shadow-2xl rounded-xl text-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h3 className="text-2xl font-semibold text-red-400 mb-3">{t('errorTitle')}</h3>
      <p className="text-slate-300 mb-6 whitespace-pre-wrap">{message}</p>
      <button
        onClick={onRetry}
        className="flex items-center justify-center px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-red-500 transition-colors duration-150 ease-in-out"
      >
        <RetryIcon className="w-5 h-5 mr-2" />
        {t('tryAgainButton')}
      </button>
    </div>
  );
};

export default ErrorDisplay;
