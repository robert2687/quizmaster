
import React from 'react';
import { useTranslation } from 'react-i18next';

interface TimerProps {
  timeLeft: number;
  totalTime: number;
}

const Timer: React.FC<TimerProps> = ({ timeLeft, totalTime }) => {
  const { t } = useTranslation();
  const percentage = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;

  // Dynamically change color based on time remaining
  let barColor = 'from-green-500 to-teal-500'; // Default color
  if (percentage < 50) {
    barColor = 'from-yellow-500 to-orange-500'; // Warning
  }
  if (percentage < 25) {
    barColor = 'from-red-500 to-pink-500'; // Danger
  }

  return (
    <div className="w-full my-4 md:my-5" aria-live="polite" aria-atomic="true">
      <div className="flex justify-between items-center mb-1 text-xs sm:text-sm">
        <span className="font-semibold text-slate-300">{t('timeLeft')}</span>
        <span className={`font-bold tabular-nums transition-colors ${timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-slate-100'}`}>
          {t('secondsRemaining', { count: timeLeft })}
        </span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2.5">
        <div
          className={`bg-gradient-to-r ${barColor} h-2.5 rounded-full transition-all duration-1000 ease-linear`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={timeLeft}
          aria-valuemin={0}
          aria-valuemax={totalTime}
          aria-label={`${timeLeft} seconds remaining`}
        ></div>
      </div>
    </div>
  );
};

export default Timer;
