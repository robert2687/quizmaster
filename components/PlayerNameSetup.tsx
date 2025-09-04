
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SparklesIcon from './icons/SparklesIcon';

interface PlayerNameSetupProps {
  onNameSubmit: (name: string) => void;
}

const PlayerNameSetup: React.FC<PlayerNameSetupProps> = ({ onNameSubmit }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onNameSubmit(name.trim());
    }
  };

  return (
    <div className="w-full max-w-md p-6 md:p-8 bg-slate-800 shadow-2xl rounded-xl text-center">
      <SparklesIcon className="w-12 h-12 mx-auto text-pink-500 mb-4" />
      <h2 className="text-3xl font-bold text-slate-100 mb-2">{t('welcomeTitle')}</h2>
      <p className="text-slate-400 mb-6">{t('welcomeSubtitle')}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="playerName" className="sr-only">
            {t('playerNameLabel')}
          </label>
          <input
            type="text"
            id="playerName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('playerNamePlaceholder')}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
            required
            maxLength={20}
            aria-label={t('playerNameLabel')}
          />
        </div>
        <button
          type="submit"
          disabled={!name.trim()}
          className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-pink-500 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {t('letsPlayButton')}
        </button>
      </form>
    </div>
  );
};

export default PlayerNameSetup;
