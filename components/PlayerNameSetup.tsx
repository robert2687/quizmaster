import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';
import Avatar, { AVATAR_OPTIONS } from './Avatar';
import SparklesIcon from './icons/SparklesIcon';

interface PlayerNameSetupProps {
  onSetupComplete: (playerName: string, avatar: string) => void;
}

const PlayerNameSetup: React.FC<PlayerNameSetupProps> = ({ onSetupComplete }) => {
  const { t } = useTranslation();
  const [playerName, setPlayerName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;
    setIsLoading(true);
    // Simulate a small delay for better UX
    setTimeout(() => {
      onSetupComplete(playerName.trim(), selectedAvatar);
      // No need to setIsLoading(false) as component will unmount
    }, 300);
  };

  const commonInputClasses = "w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors";

  return (
    <div className="w-full max-w-lg p-6 md:p-8 bg-slate-800 shadow-2xl rounded-xl">
      <div className="text-center mb-6">
        <SparklesIcon className="w-10 h-10 mx-auto text-pink-500 mb-2" />
        <h2 className="text-2xl font-bold text-slate-100">{t('setupProfileTitle')}</h2>
        <p className="text-slate-400 mt-2">{t('setupProfileSubtitle')}</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">{t('avatarLabel')}</label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {AVATAR_OPTIONS.map(avatarId => (
              <button
                key={avatarId}
                type="button"
                onClick={() => setSelectedAvatar(avatarId)}
                className={`p-1 rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                  selectedAvatar === avatarId ? 'ring-2 ring-purple-500' : 'ring-2 ring-transparent'
                }`}
                aria-label={`Select avatar ${avatarId}`}
                aria-pressed={selectedAvatar === avatarId}
              >
                <Avatar avatarId={avatarId} className="w-12 h-12" />
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label htmlFor="playerName" className="block text-sm font-medium text-slate-300 mb-1">
            {t('playerNameLabel')}
          </label>
          <input
            type="text"
            id="playerName"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className={commonInputClasses}
            placeholder={t('playerNamePlaceholder')}
            required
            maxLength={20}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading || !playerName.trim()}
          className="w-full"
        >
          {isLoading ? (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            t('startPlayingButton')
          )}
        </Button>
      </form>
    </div>
  );
};

export default PlayerNameSetup;
