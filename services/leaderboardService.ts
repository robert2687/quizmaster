import { LeaderboardEntry, LeaderboardFilters } from '../types';

const LEADERBOARD_KEY = 'quizMasterLeaderboard';

/**
 * Gets the start date of the current week (Monday).
 * @returns The timestamp for the start of the week.
 */
const getSeasonStartDate = (): number => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // Sunday = 0, Monday = 1, ...
    // Adjust to make Monday the start of the week.
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); 
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0); // Set to the beginning of the day.
    return monday.getTime();
}

/**
 * Retrieves the leaderboard from localStorage. This represents a real, persistent
 * leaderboard populated only by actual users of this application instance.
 * @param filters - The filters to apply (season and topic).
 * @returns A promise that resolves to the filtered and sorted list of leaderboard entries.
 */
export const getLeaderboard = async (filters: LeaderboardFilters): Promise<LeaderboardEntry[]> => {
  try {
    const storedLeaderboard = localStorage.getItem(LEADERBOARD_KEY);
    let leaderboard: LeaderboardEntry[] = storedLeaderboard ? JSON.parse(storedLeaderboard) : [];
    
    let filteredData = leaderboard;

    // Filter by season (weekly or all-time)
    if (filters.season === 'weekly') {
        const seasonStart = getSeasonStartDate();
        filteredData = filteredData.filter(entry => entry.timestamp >= seasonStart);
    }

    // Filter by topic if a filter is provided
    if (filters.topic && filters.topic.trim() !== '') {
        const lowercasedTopic = filters.topic.toLowerCase();
        filteredData = filteredData.filter(entry => entry.topic.toLowerCase().includes(lowercasedTopic));
    }

    // Sort the results by points (descending), then by timestamp (most recent) for tie-breaking.
    filteredData.sort((a, b) => b.points - a.points || b.timestamp - a.timestamp);
    
    return filteredData;
  } catch (e) {
    console.error("Failed to get leaderboard:", e);
    throw new Error("Could not retrieve leaderboard data.");
  }
};

/**
 * Posts a new score to the leaderboard.
 * It checks for an existing score by the same user on the same topic and only
 * keeps the highest score, ensuring personal bests are recorded.
 * @param newEntry - The new score data to post.
 * @returns A promise that resolves to the leaderboard entry that was saved (either new or existing).
 */
export const postScore = async (newEntry: Omit<LeaderboardEntry, 'id' | 'timestamp'>): Promise<LeaderboardEntry> => {
  const entryWithMetadata: LeaderboardEntry = {
    ...newEntry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  try {
    const storedLeaderboard = localStorage.getItem(LEADERBOARD_KEY);
    let leaderboard: LeaderboardEntry[] = storedLeaderboard ? JSON.parse(storedLeaderboard) : [];
    
    const existingScoreIndex = leaderboard.findIndex(e => e.userEmail === entryWithMetadata.userEmail && e.topic === entryWithMetadata.topic);
    
    if (existingScoreIndex !== -1) {
        const existingEntry = leaderboard[existingScoreIndex];
        // If the new score is not higher, do nothing and return the existing, better score.
        if (existingEntry.points >= entryWithMetadata.points) {
            return existingEntry;
        }
        // Otherwise, update the existing entry with the new, higher score.
        leaderboard[existingScoreIndex] = entryWithMetadata;
    } else {
        // If no existing score for this user/topic, add the new one.
        leaderboard.push(entryWithMetadata);
    }
    
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
    return entryWithMetadata;
  } catch (e) {
    console.error("Failed to post score:", e);
    throw new Error("Could not submit score to the leaderboard.");
  }
};