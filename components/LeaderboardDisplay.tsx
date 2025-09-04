import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LeaderboardEntry } from '../types';
import { getLeaderboard } from '../services/leaderboardService';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay'; // Re-use the ErrorDisplay component

interface LeaderboardDisplayProps {
  onBack: () => void;
  playerName: string | null; // Add playerName to identify the user's score
}

const LeaderboardDisplay: React.FC<LeaderboardDisplayProps> = ({ onBack, playerName }) => {
  const { t, i18n } = useTranslation();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getLeaderboard();
      setLeaderboard(data);
    } catch (err) {
      setError(t('leaderboardError'));
      console.error("Failed to fetch leaderboard", err);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(i18n.language, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="min-h-[300px] flex items-center justify-center">
            <LoadingSpinner message={t('leaderboardLoading')} />
        </div>
      );
    }

    if (error) {
       return <ErrorDisplay message={error} onRetry={fetchLeaderboard} />;
    }
    
    if (leaderboard.length === 0) {
        return (
            <div className="min-h-[300px] flex items-center justify-center">
                <p className="text-center text-slate-400 text-lg py-8">{t('leaderboardNoScores')}</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-max text-sm text-left text-slate-300">
            <thead className="text-sm font-semibold text-purple-300 uppercase bg-slate-900/70">
                <tr>
                    <th scope="col" className="px-4 py-3 w-16 text-center">{t('leaderboardRank')}</th>
                    <th scope="col" className="px-4 py-3">{t('leaderboardPlayer')}</th>
                    <th scope="col" className="px-4 py-3">{t('leaderboardTopic')}</th>
                    <th scope="col" className="px-4 py-3 text-center">{t('leaderboardPoints')}</th>
                    <th scope="col" className="px-4 py-3 text-right">{t('leaderboardDate')}</th>
                </tr>
            </thead>
            <tbody>
                {leaderboard.map((entry, index) => {
                  const isCurrentUser = playerName && entry.playerName === playerName;
                  return (
                    <tr 
                      key={entry.id} 
                      className={`border-b border-slate-700 transition-colors duration-200 ${
                        isCurrentUser 
                          ? 'bg-purple-900/60 border-l-4 border-purple-500' 
                          : 'hover:bg-slate-700/50'
                      }`}
                    >
                        <td className={`px-4 py-3 text-center font-bold ${isCurrentUser ? 'text-purple-300' : 'text-slate-100'}`}>
                          #{index + 1}
                        </td>
                        <td className="px-4 py-3 font-semibold text-white">{entry.playerName}</td>
                        <td className="px-4 py-3 font-medium text-slate-200 break-words max-w-xs">{entry.topic}</td>
                        <td className="px-4 py-3 text-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                        {entry.points}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-400">{formatDate(entry.timestamp)}</td>
                    </tr>
                  );
                })}
            </tbody>
            </table>
        </div>
    );
  }

  return (
    <div className="w-full max-w-4xl p-6 md:p-8 bg-slate-800 shadow-2xl rounded-xl">
      <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
        {t('leaderboardTitle')}
      </h2>

      {renderContent()}
      
      <div className="mt-8 flex justify-end">
        <button
          onClick={onBack}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-pink-500 transition-colors duration-150 ease-in-out"
        >
          {t('backToQuizButton')}
        </button>
      </div>
    </div>
  );
};

export default LeaderboardDisplay;