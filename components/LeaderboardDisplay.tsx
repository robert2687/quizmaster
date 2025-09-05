import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LeaderboardEntry, LeaderboardFilters } from '../types';
import { getLeaderboard } from '../services/leaderboardService';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import Button from './Button';
import Avatar from './Avatar';
import MedalIcon from './icons/MedalIcon';

interface LeaderboardDisplayProps {
  onBack: () => void;
  userId: string | null;
  title: string;
  topicFilter?: string;
}

interface DisplayEntry extends LeaderboardEntry {
  isNew?: boolean;
}

const LeaderboardDisplay: React.FC<LeaderboardDisplayProps> = ({ onBack, userId, title, topicFilter }) => {
  const { t, i18n } = useTranslation();
  const [leaderboard, setLeaderboard] = useState<DisplayEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<LeaderboardFilters>({ 
      season: 'weekly', 
      topic: topicFilter || '' 
  });
  
  // Ref to track IDs of entries from the previous fetch to identify new ones.
  const previousEntryIds = useRef(new Set<number>());

  const fetchLeaderboard = useCallback(async () => {
    // Don't show loading spinner on subsequent polls, only on initial load or filter change
    if (!previousEntryIds.current.size) {
        setIsLoading(true);
    }
    setError(null);
    try {
      const data = await getLeaderboard(filters);
      const currentIds = new Set(data.map(e => e.id));
      
      const newDisplayedEntries: DisplayEntry[] = data.map(entry => ({
          ...entry,
          // Mark as new if it wasn't in the previous set, but not on the very first load.
          isNew: !previousEntryIds.current.has(entry.id) && previousEntryIds.current.size > 0
      }));

      setLeaderboard(newDisplayedEntries);
      previousEntryIds.current = currentIds;

    } catch (err) {
      setError(t('leaderboardError'));
      console.error("Failed to fetch leaderboard", err);
    } finally {
      setIsLoading(false);
    }
  }, [t, filters]);

  // Initial fetch and filter-based refetch
  useEffect(() => {
    previousEntryIds.current.clear(); // Reset on filter change to allow initial load state
    fetchLeaderboard();
  }, [fetchLeaderboard]);
  
  // Polling for live updates
  useEffect(() => {
    const pollInterval = Math.random() * 3000 + 4000; // Poll every 4-7 seconds
    const intervalId = setInterval(() => {
      fetchLeaderboard();
    }, pollInterval);
    
    return () => clearInterval(intervalId);
  }, [fetchLeaderboard]);


  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(i18n.language, {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const handleFilterChange = (newFilters: Partial<LeaderboardFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }
  
  const renderLeaderboardCard = (entry: DisplayEntry, rank: number) => {
    const isCurrentUser = userId && entry.userId === userId;
    let cardClasses = 'p-4 rounded-lg shadow transition-colors duration-300';
    if (isCurrentUser) cardClasses += ' bg-purple-900/60 border-l-4 border-purple-500';
    else cardClasses += ' bg-slate-700';
     if (entry.isNew && !isCurrentUser) cardClasses += ' animate-highlight-fade';
    
    return (
        <div key={entry.id} className={cardClasses}>
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                     <div className="flex items-center justify-center font-bold text-slate-100 w-8 text-center">
                        {rank <= 3 && filters.topic === '' ? <MedalIcon rank={rank} className="w-6 h-6" /> : <span>#{rank}</span>}
                    </div>
                    <Avatar avatarId={entry.avatarId} className="w-10 h-10 rounded-full flex-shrink-0" />
                    <div className="flex-grow min-w-0">
                        <p className="font-semibold text-white truncate">{entry.playerName}</p>
                        <p className="text-xs text-slate-400">{formatDate(entry.timestamp)}</p>
                    </div>
                </div>
                <div className="text-right flex-shrink-0 pl-2">
                    <p className="font-bold text-lg text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-400">{entry.points}</p>
                </div>
            </div>
            <p className="mt-2 text-sm text-slate-300 break-words pl-11">{entry.topic}</p>
        </div>
    );
  };
  
  const renderLeaderboardRows = (entries: DisplayEntry[], rankOffset: number = 0) => {
    return entries.map((entry, index) => {
        const rank = rankOffset + index + 1;
        const isCurrentUser = userId && entry.userId === userId;
        
        let rowClasses = 'border-b border-slate-700 transition-all duration-200';
        if (entry.isNew && !isCurrentUser) rowClasses += ' animate-highlight-fade';
        if (isCurrentUser) rowClasses += ' bg-purple-900/60 border-l-4 border-purple-500 scale-[1.01] shadow-lg';
        else rowClasses += ' hover:bg-slate-700/50';

        return (
            <tr 
                key={entry.id} 
                className={rowClasses}
            >
                <td className="px-4 py-3 text-center font-bold text-slate-100">
                    <div className="flex items-center justify-center space-x-2">
                        {rank <= 3 && filters.topic === '' ? <MedalIcon rank={rank} className="w-6 h-6" /> : <span>#{rank}</span>}
                    </div>
                </td>
                <td className="px-4 py-3 font-semibold text-white">
                  <div className="flex items-center gap-3">
                    <Avatar avatarId={entry.avatarId} className="w-8 h-8 rounded-full flex-shrink-0" />
                    <span className="truncate">{entry.playerName}</span>
                    {isCurrentUser && <span className="text-xs bg-purple-500 text-white font-bold px-2 py-0.5 rounded-full">You</span>}
                  </div>
                </td>
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
    
    if (leaderboard.length === 0) {
        return (
            <div className="min-h-[300px] flex items-center justify-center">
                <p className="text-center text-slate-400 text-lg py-8">{t('leaderboardNoScores')}</p>
            </div>
        );
    }

    const fullLeaderboard = leaderboard;
    const top10 = fullLeaderboard.slice(0, 10);
    const playerIndex = userId ? fullLeaderboard.findIndex(e => e.userId === userId) : -1;
    const isPlayerInTop10 = playerIndex !== -1 && playerIndex < 10;
    const shouldShowPlayerRank = playerIndex !== -1 && !isPlayerInTop10;

    let playerAndNeighbors: DisplayEntry[] = [];
    if (shouldShowPlayerRank) {
        const startIndex = Math.max(0, playerIndex - 1);
        const endIndex = Math.min(fullLeaderboard.length, playerIndex + 2);
        playerAndNeighbors = fullLeaderboard.slice(startIndex, endIndex);
    }

    return (
      <div className="max-h-[60vh] overflow-y-auto pr-2">
        {/* Mobile View: Card List */}
        <div className="sm:hidden space-y-3">
          {top10.map((entry, index) => renderLeaderboardCard(entry, index + 1))}
          {shouldShowPlayerRank && (
            <>
              <div className="text-center py-2 text-slate-500 font-bold tracking-widest">...</div>
              {playerAndNeighbors.map((entry) => {
                  const rank = fullLeaderboard.findIndex(e => e.id === entry.id);
                  return renderLeaderboardCard(entry, rank + 1);
              })}
            </>
          )}
        </div>
        
        {/* Desktop View: Table */}
        <div className="hidden sm:block">
            <table className="w-full min-w-max text-sm text-left text-slate-300">
            <thead className="text-sm font-semibold text-purple-300 uppercase bg-slate-900/70 sticky top-0">
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
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl p-4 sm:p-6 md:p-8 bg-slate-800 shadow-2xl rounded-xl">
      <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
        {title}
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
            disabled={!!topicFilter} // Disable topic filter when viewing a specific challenge
          />
          {filters.topic && !topicFilter && (
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