import React from 'react';
import { useTranslation } from 'react-i18next';
import { Difficulty, ChallengeStatus } from '../types';
import Button from './Button';
import FireIcon from './icons/FireIcon';
import CheckIcon from './icons/CheckIcon';

interface DailyChallengeDisplayProps {
  dailyChallengeTopic: string;
  challengeStatus: ChallengeStatus | null;
  onPlay: (topic: string, difficulty: Difficulty, useGrounding: boolean, isChallenge: boolean) => void;
  onViewLeaderboard: () => void;
}

const DailyChallengeDisplay: React.FC<DailyChallengeDisplayProps> = ({
  dailyChallengeTopic,
  challengeStatus,
  onPlay,
  onViewLeaderboard,
}) => {
  const { t } = useTranslation();

  const hasCompletedToday = challengeStatus?.completedToday ?? false;
  const streak = challengeStatus?.streak ?? 0;

  return (
    <div className="mt-6 p-6 bg-slate-800 rounded-xl shadow-lg w-full max-w-lg border border-purple-800/50">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-slate-100">{t('dailyChallengeTitle')}</h3>
        {streak > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 rounded-full text-sm font-semibold">
            <FireIcon className="w-4 h-4" />
            <span>{t('dailyChallengeStreak', { count: streak })}</span>
          </div>
        )}
      </div>

      <p className="text-center text-lg text-purple-300 mb-5 font-medium">
        {dailyChallengeTopic}
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={() => onPlay(dailyChallengeTopic, Difficulty.MEDIUM, true, true)}
          disabled={hasCompletedToday}
          className="w-full sm:w-auto"
        >
          {hasCompletedToday ? (
            <>
              <CheckIcon className="w-5 h-5 mr-2" />
              {t('challengeCompletedButton')}
            </>
          ) : (
            t('playChallengeButton')
          )}
        </Button>
        <Button
          onClick={onViewLeaderboard}
          variant="secondary"
          className="w-full sm:w-auto !bg-slate-700 hover:!bg-slate-600 !from-slate-700 !to-slate-700"
        >
          {t('viewChallengeLeaderboardButton')}
        </Button>
      </div>
    </div>
  );
};

export default DailyChallengeDisplay;
