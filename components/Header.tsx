
import React from 'react';
import { useTranslation } from 'react-i18next';
import SparklesIcon from './icons/SparklesIcon';

const Header: React.FC = () => {
  const { t } = useTranslation();
  return (
    <header className="py-6 md:py-8 text-center">
      <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 inline-flex items-center">
        <SparklesIcon className="w-8 h-8 md:w-10 md:h-10 mr-2 md:mr-3 text-pink-500" />
        {t('appName')}
      </h1>
      <p className="mt-2 text-slate-400 text-sm md:text-base">{t('headerSubtitle')}</p>
    </header>
  );
};

export default Header;
