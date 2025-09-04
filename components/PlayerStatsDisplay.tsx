import React from 'react';
import { useTranslation } from 'react-i18next';
import { PlayerStats } from '../types';
import { getXpProgress } from '../services/playerStatsService';

interface PlayerStatsDisplayProps {
  stats: PlayerStats | null;
}

const PlayerStatsDisplay: React.FC<PlayerStatsDisplayProps> = ({ stats }) => {
  const { t } = useTranslation();

  if (!stats) {
    return null;
  }

  const { current, total } = getXpProgress(stats);
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="w-full max-w-xs text-sm">
      <div className="flex justify-between items-baseline mb-1">
        <span className="font-bold text-purple-300">{t('levelLabel')} {stats.level}</span>
        <span className="font-semibold text-slate-400">{t('xpLabel')}: {stats.xp.toLocaleString()}</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2.5 relative group">
        <div
          className="bg-gradient-to-r from-purple-500 to-pink-500 h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        ></div>
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block px-2 py-1 bg-slate-900 text-white rounded-md text-xs whitespace-nowrap shadow-lg">
          {current.toLocaleString()} / {total.toLocaleString()} XP
        </div>
      </div>
    </div>
  );
};

export default PlayerStatsDisplay;