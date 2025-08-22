import React from "react";
import { useTranslation } from "react-i18next";

const LanguageSwitcher: React.FC = () => {
  const { t, i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage = i18n.language;

  return (
    <div className="flex space-x-2 items-center">
      <button 
        onClick={() => changeLanguage("en")}
        disabled={currentLanguage === 'en'}
        className={`px-3 py-1 text-sm rounded-md transition-colors
                    ${currentLanguage === 'en' 
                      ? 'bg-purple-600 text-white cursor-default' 
                      : 'bg-slate-700 hover:bg-purple-500 text-slate-300 hover:text-white'
                    }`}
        aria-pressed={currentLanguage === 'en'}
      >
        {t('switchToEnglish')}
      </button>
      <button 
        onClick={() => changeLanguage("sk")}
        disabled={currentLanguage === 'sk'}
        className={`px-3 py-1 text-sm rounded-md transition-colors
                    ${currentLanguage === 'sk' 
                      ? 'bg-purple-600 text-white cursor-default' 
                      : 'bg-slate-700 hover:bg-purple-500 text-slate-300 hover:text-white'
                    }`}
        aria-pressed={currentLanguage === 'sk'}
      >
        {t('switchToSlovak')}
      </button>
    </div>
  );
};

export default LanguageSwitcher;