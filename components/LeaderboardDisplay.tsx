
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { LeaderboardEntry } from '../types';

interface LeaderboardDisplayProps {
  onBack: () => void;
}

const LEADERBOARD_KEY = 'quizMasterLeaderboard';
const MAX_LEADERBOARD_ENTRIES = 10;

const LeaderboardDisplay: React.FC<LeaderboardDisplayProps> = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  useEffect(() => {
    const storedLeaderboard = localStorage.getItem(LEADERBOARD_KEY);
    if (storedLeaderboard) {
      try {
        const parsedLeaderboard = JSON.parse(storedLeaderboard) as LeaderboardEntry[];
        // Sort by percentage descending, then by timestamp descending for ties
        parsedLeaderboard.sort((a, b) => {
          if (b.percentage !== a.percentage) {
            return b.percentage - a.percentage;
          }
          return b.timestamp - a.timestamp;
        });
        setLeaderboard(parsedLeaderboard.slice(0, MAX_LEADERBOARD_ENTRIES));
      } catch (error) {
        console.error("Failed to parse leaderboard from localStorage", error);
        setLeaderboard([]);
      }
    }
  }, []);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(i18n.language, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  return (
    <div className="w-full max-w-3xl p-6 md:p-8 bg-slate-800 shadow-2xl rounded-xl">
      <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
        {t('leaderboardTitle')}
      </h2>

      {leaderboard.length === 0 ? (
        <p className="text-center text-slate-400 text-lg py-8">{t('leaderboardNoScores')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-max text-sm text-left text-slate-300">
            <thead className="text-xs text-purple-300 uppercase bg-slate-700">
              <tr>
                <th scope="col" className="px-4 py-3 w-16 text-center">{t('leaderboardRank')}</th>
                <th scope="col" className="px-4 py-3">{t('leaderboardTopic')}</th>
                <th scope="col" className="px-4 py-3 text-center">{t('leaderboardScore')}</th>
                <th scope="col" className="px-4 py-3 text-right">{t('leaderboardDate')}</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr key={entry.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                  <td className="px-4 py-3 text-center font-medium text-slate-100">#{index + 1}</td>
                  <td className="px-4 py-3 font-medium text-slate-100 break-all">{entry.topic}</td>
                  <td className="px-4 py-3 text-center">
                    {entry.score}/{entry.totalQuestions} ({entry.percentage}%)
                  </td>
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

export default LeaderboardDisplay;
