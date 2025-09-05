import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QuizHistoryEntry } from '../types';
import Button from './Button';

interface QuizHistoryDisplayProps {
  onBack: () => void;
  playerIdentifier: string | null; // Use a stable identifier like user ID
}

const HISTORY_KEY_PREFIX = 'quizMasterHistory_';

const QuizHistoryDisplay: React.FC<QuizHistoryDisplayProps> = ({ onBack, playerIdentifier }) => {
  const { t, i18n } = useTranslation();
  const [history, setHistory] = useState<QuizHistoryEntry[]>([]);

  useEffect(() => {
    if (!playerIdentifier) return;
    const historyKey = `${HISTORY_KEY_PREFIX}${playerIdentifier}`;
    const storedHistory = localStorage.getItem(historyKey);
    if (storedHistory) {
      try {
        const parsedHistory = JSON.parse(storedHistory) as QuizHistoryEntry[];
        setHistory(parsedHistory);
      // FIX: Added curly braces to the catch block to correct the syntax error.
      } catch (error) {
        console.error("Failed to parse history from localStorage", error);
        setHistory([]);
      }
    }
  }, [playerIdentifier]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(i18n.language, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-3xl p-4 sm:p-6 md:p-8 bg-slate-800 shadow-2xl rounded-xl">
      <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
        {t('historyTitle')}
      </h2>

      {history.length === 0 ? (
        <p className="text-center text-slate-400 text-lg py-8">{t('historyNoHistory')}</p>
      ) : (
        <div className="overflow-y-auto max-h-[60vh] pr-2">
           {/* Mobile Card View */}
            <div className="space-y-3 sm:hidden">
              {history.map((entry) => (
                <div key={entry.id} className="p-4 rounded-lg shadow bg-slate-700 hover:bg-slate-700/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <p className="font-semibold text-slate-100 break-words flex-1 pr-4">{entry.topic}</p>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">{entry.points}</p>
                      <p className="text-sm text-slate-300">{entry.correctAnswers}/{entry.totalQuestions}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between items-center text-xs text-slate-400">
                    <span>{t(`difficulty${entry.difficulty}`)}</span>
                    <span>{formatDate(entry.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <table className="w-full min-w-max text-sm text-left text-slate-300 hidden sm:table">
                <thead className="text-xs text-purple-300 uppercase bg-slate-700 sticky top-0">
                <tr>
                    <th scope="col" className="px-4 py-3">{t('leaderboardTopic')}</th>
                    <th scope="col" className="px-4 py-3 text-center">{t('leaderboardPoints')}</th>
                    <th scope="col" className="px-4 py-3 text-center">{t('historyScore')}</th>
                    <th scope="col" className="px-4 py-3 text-center">{t('historyDifficulty')}</th>
                    <th scope="col" className="px-4 py-3 text-right">{t('leaderboardDate')}</th>
                </tr>
                </thead>
                <tbody>
                {history.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                    <td className="px-4 py-3 font-semibold text-slate-100 break-words">{entry.topic}</td>
                    <td className="px-4 py-3 text-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                        {entry.points}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-slate-200">
                        {entry.correctAnswers}/{entry.totalQuestions}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-slate-200">{t(`difficulty${entry.difficulty}`)}</td>
                    <td className="px-4 py-3 text-right text-slate-400">{formatDate(entry.timestamp)}</td>
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
      )}

      <div className="mt-8 flex justify-end">
        <Button
            onClick={onBack}
        >
            {t('backToQuizButton')}
        </Button>
      </div>
    </div>
  );
};

export default QuizHistoryDisplay;