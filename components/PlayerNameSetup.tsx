import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SparklesIcon from './icons/SparklesIcon';
import Button from './Button';

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
        <Button
          type="submit"
          disabled={!name.trim()}
          className="w-full"
        >
          {t('letsPlayButton')}
        </Button>
      </form>
    </div>
  );
};

export default PlayerNameSetup;
