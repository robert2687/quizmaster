
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QuizHistoryEntry } from '../types';

interface QuizHistoryDisplayProps {
  onBack: () => void;
  playerName: string | null;
}

const HISTORY_KEY_PREFIX = 'quizMasterHistory_';

const QuizHistoryDisplay: React.FC<QuizHistoryDisplayProps> = ({ onBack, playerName }) => {
  const { t, i18n } = useTranslation();
  const [history, setHistory] = useState<QuizHistoryEntry[]>([]);

  useEffect(() => {
    if (!playerName) return;
    const historyKey = `${HISTORY_KEY_PREFIX}${playerName}`;
    const storedHistory = localStorage.getItem(historyKey);
    if (storedHistory) {
      try {
        const parsedHistory = JSON.parse(storedHistory) as QuizHistoryEntry[];
        setHistory(parsedHistory);
      } catch (error) {
        console.error("Failed to parse history from localStorage", error);
        setHistory([]);
      }
    }
  }, [playerName]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(i18n.language, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-3xl p-6 md:p-8 bg-slate-800 shadow-2xl rounded-xl">
      <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
        {t('historyTitle')}
      </h2>

      {history.length === 0 ? (
        <p className="text-center text-slate-400 text-lg py-8">{t('historyNoHistory')}</p>
      ) : (
        <div className="overflow-y-auto max-h-[60vh] pr-2">
          <table className="w-full min-w-max text-sm text-left text-slate-300">
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
                  <td className="px-4 py-3 font-semibold text-slate-100 break-all">{entry.topic}</td>
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

      <button
        onClick={onBack}
        className="mt-8 w-full sm:w-auto sm:float-right px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-pink-500 transition-colors duration-150 ease-in-out"
      >
        {t('backToQuizButton')}
      </button>
    </div>
  );
};

export default QuizHistoryDisplay;
