import { LeaderboardEntry, LeaderboardFilters } from '../types';

const LEADERBOARD_KEY = 'quizMasterLeaderboard';
const SIMULATED_DELAY = 500; // ms to simulate network latency

/**
 * Simulates a network request with a delay.
 * @param data The data to return on success.
 * @param fail Whether the request should simulate a failure.
 * @returns A promise that resolves with the data or rejects with an error.
 */
const fakeFetch = <T>(data: T, fail: boolean = false): Promise<T> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (fail) {
        reject(new Error("Failed to connect to the leaderboard server."));
      } else {
        resolve(data);
      }
    }, SIMULATED_DELAY);
  });
};

/**
 * Calculates the timestamp for the start of the current week (Monday).
 * This defines the start of the "weekly season".
 * @returns The Unix timestamp for the start of the week.
 */
const getSeasonStartDate = (): number => {
    const now = new Date();
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    const dayOfWeek = now.getDay();
    // Calculate the difference to the last Monday. If today is Sunday (0), go back 6 days. Otherwise, go back (dayOfWeek - 1) days.
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0); // Set to the very beginning of Monday.
    return monday.getTime();
}

/**
 * Fetches the leaderboard data, with optional filtering.
 * @returns A promise that resolves with an array of leaderboard entries.
 */
export const getLeaderboard = async (filters: LeaderboardFilters): Promise<LeaderboardEntry[]> => {
  try {
    const storedLeaderboard = localStorage.getItem(LEADERBOARD_KEY);
    const leaderboard: LeaderboardEntry[] = storedLeaderboard ? JSON.parse(storedLeaderboard) : [];
    
    let filteredData = leaderboard;

    // Apply season filter
    if (filters.season === 'weekly') {
        const seasonStart = getSeasonStartDate();
        filteredData = filteredData.filter(entry => entry.timestamp >= seasonStart);
    }

    // Apply topic filter
    if (filters.topic && filters.topic.trim() !== '') {
        const lowercasedTopic = filters.topic.toLowerCase();
        filteredData = filteredData.filter(entry => entry.topic.toLowerCase().includes(lowercasedTopic));
    }

    // Sort by points (desc), then by timestamp (desc) to break ties
    filteredData.sort((a, b) => b.points - a.points || b.timestamp - a.timestamp);
    
    // Simulate fetching from an API
    return await fakeFetch(filteredData);
  } catch (e) {
    console.error("Failed to get leaderboard:", e);
    throw new Error("Could not retrieve leaderboard data.");
  }
};

/**
 * Posts a new score to the leaderboard.
 * @param newEntry The new score entry to add.
 * @returns A promise that resolves with the successfully added entry.
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
    
    leaderboard.push(entryWithMetadata);
    
    // Leaderboard is sorted on fetch, but we can do a simple save here.
    // In a real DB, you'd just insert.
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));

    // Simulate posting to an API
    return await fakeFetch(entryWithMetadata);
  } catch (e) {
    console.error("Failed to post score:", e);
    throw new Error("Could not submit score to the leaderboard.");
  }
};