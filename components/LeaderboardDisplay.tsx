import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LeaderboardEntry, LeaderboardFilters } from '../types';
import { getLeaderboard } from '../services/leaderboardService';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay'; // Re-use the ErrorDisplay component
import Button from './Button';

interface LeaderboardDisplayProps {
  onBack: () => void;
  playerName: string | null; // Add playerName to identify the user's score
}

const LeaderboardDisplay: React.FC<LeaderboardDisplayProps> = ({ onBack, playerName }) => {
  const { t, i18n } = useTranslation();
  const [fullLeaderboard, setFullLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LeaderboardFilters>({ season: 'weekly', topic: '' });

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getLeaderboard(filters);
      setFullLeaderboard(data);
    } catch (err) {
      setError(t('leaderboardError'));
      console.error("Failed to fetch leaderboard", err);
    } finally {
      setIsLoading(false);
    }
  }, [t, filters]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(i18n.language, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleFilterChange = (newFilters: Partial<LeaderboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }
  
  const renderLeaderboardRows = (entries: LeaderboardEntry[], rankOffset: number = 0) => {
    return entries.map((entry, index) => {
        const rank = rankOffset + index + 1;
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
                    #{rank}
                </td>
                <td className="px-4 py-3 font-semibold text-white">{entry.playerName}</td>
                <td className="px-4 py-3 font-medium text-slate-200 break-words max-w-xs">{entry.topic}</td>
                <td className="px-4 py-3 text-center font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">
                {entry.points}
                </td>
                <td className="px-4 py-3 text-right text-slate-400">{formatDate(entry.timestamp)}</td>
            </tr>
        );
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
    
    if (fullLeaderboard.length === 0) {
        return (
            <div className="min-h-[300px] flex items-center justify-center">
                <p className="text-center text-slate-400 text-lg py-8">{t('leaderboardNoScores')}</p>
            </div>
        );
    }

    const top10 = fullLeaderboard.slice(0, 10);
    const playerIndex = playerName ? fullLeaderboard.findIndex(e => e.playerName === playerName && e.id === fullLeaderboard.find(p => p.playerName === playerName)?.id) : -1;
    const isPlayerInTop10 = playerIndex !== -1 && playerIndex < 10;
    const shouldShowPlayerRank = playerIndex !== -1 && !isPlayerInTop10;

    let playerAndNeighbors: LeaderboardEntry[] = [];
    if (shouldShowPlayerRank) {
        const startIndex = Math.max(0, playerIndex - 1);
        const endIndex = Math.min(fullLeaderboard.length, playerIndex + 2);
        playerAndNeighbors = fullLeaderboard.slice(startIndex, endIndex);
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
                {renderLeaderboardRows(top10)}
                {shouldShowPlayerRank && (
                    <>
                        <tr>
                            <td colSpan={5} className="text-center py-3 text-slate-500 font-bold tracking-widest">...</td>
                        </tr>
                        {renderLeaderboardRows(playerAndNeighbors, Math.max(0, playerIndex - 1))}
                    </>
                )}
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

      <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-slate-900/50 rounded-lg">
        <div className="flex-shrink-0">
          <div className="flex items-center bg-slate-700 rounded-md p-1">
            <button 
              onClick={() => handleFilterChange({ season: 'weekly' })}
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${filters.season === 'weekly' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
            >{t('leaderboardThisWeek')}</button>
            <button 
              onClick={() => handleFilterChange({ season: 'all-time' })}
              className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${filters.season === 'all-time' ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-600'}`}
            >{t('leaderboardAllTime')}</button>
          </div>
        </div>
        <div className="relative flex-grow">
          <input 
            type="text"
            value={filters.topic}
            onChange={(e) => handleFilterChange({ topic: e.target.value })}
            placeholder={t('leaderboardFilterByTopic')}
            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
          />
          {filters.topic && (
            <button
              onClick={() => handleFilterChange({ topic: '' })}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-white"
              aria-label={t('clearFilter')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {renderContent()}
      
      <div className="mt-8 flex justify-end">
        <Button onClick={onBack}>
          {t('backToQuizButton')}
        </Button>
      </div>
    </div>
  );
};

export default LeaderboardDisplay;
