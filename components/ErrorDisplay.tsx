import React from 'react';
import { useTranslation } from 'react-i18next';
import RetryIcon from './icons/RetryIcon';
import Button from './Button';

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
      <Button
        onClick={onRetry}
        variant="danger"
      >
        <RetryIcon className="w-5 h-5 mr-2" />
        {t('tryAgainButton')}
      </Button>
    </div>
  );
};

export default ErrorDisplay;
