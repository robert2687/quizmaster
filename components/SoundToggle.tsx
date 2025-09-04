
import React from 'react';
import { useTranslation } from 'react-i18next';
import SoundOnIcon from './icons/SoundOnIcon';
import SoundOffIcon from './icons/SoundOffIcon';

interface SoundToggleProps {
  isSoundEnabled: boolean;
  onToggle: () => void;
}

const SoundToggle: React.FC<SoundToggleProps> = ({ isSoundEnabled, onToggle }) => {
  const { t } = useTranslation();
  return (
    <button
      onClick={onToggle}
      className="p-2 rounded-full text-slate-400 hover:text-purple-400 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 transition-colors"
      aria-label={isSoundEnabled ? t('soundOff') : t('soundOn')}
    >
      {isSoundEnabled ? (
        <SoundOnIcon className="w-5 h-5" />
      ) : (
        <SoundOffIcon className="w-5 h-5" />
      )}
    </button>
  );
};

export default SoundToggle;
