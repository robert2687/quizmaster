import React from 'react';
import { useTranslation } from 'react-i18next';
import { ALL_ACHIEVEMENTS, getUnlockedAchievementIds } from '../services/achievementsService';
import Button from './Button';
import TrophyIcon from './icons/TrophyIcon';

interface AchievementsDisplayProps {
  onBack: () => void;
  playerIdentifier: string | null; // Use a stable identifier like email
}

const AchievementsDisplay: React.FC<AchievementsDisplayProps> = ({ onBack, playerIdentifier }) => {
  const { t } = useTranslation();
  const unlockedIds = playerIdentifier ? getUnlockedAchievementIds(playerIdentifier) : new Set<string>();

  return (
    <div className="w-full max-w-2xl p-6 md:p-8 bg-slate-800 shadow-2xl rounded-xl">
      <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
        {t('achievementsTitle')}
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2">
        {Object.values(ALL_ACHIEVEMENTS).map(ach => {
          const isUnlocked = unlockedIds.has(ach.id);
          return (
            <div 
              key={ach.id} 
              className={`p-4 rounded-lg flex items-start space-x-4 transition-all duration-200 ease-in-out ${
                isUnlocked ? 'bg-slate-700 shadow-md' : 'bg-slate-700/50'
              }`}
              aria-label={`${t(ach.nameKey)}: ${isUnlocked ? 'Unlocked' : 'Locked'}`}
            >
              <div 
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                  isUnlocked ? 'bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg' : 'bg-slate-600'
                }`}
              >
                <TrophyIcon className={`w-7 h-7 ${isUnlocked ? 'text-white' : 'text-slate-400'}`} />
              </div>
              <div className="flex-grow">
                <h3 className={`font-bold ${isUnlocked ? 'text-slate-100' : 'text-slate-400'}`}>
                  {t(ach.nameKey)}
                </h3>
                <p className={`text-sm mt-1 ${isUnlocked ? 'text-slate-300' : 'text-slate-500'}`}>
                  {t(ach.descriptionKey)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <Button onClick={onBack}>
          {t('backToQuizButton')}
        </Button>
      </div>
    </div>
  );
};

export default AchievementsDisplay;
