import { LeaderboardEntry } from '../types';

const LEADERBOARD_KEY = 'quizMasterLeaderboard';
const MAX_LEADERBOARD_ENTRIES = 10;
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
 * Fetches the leaderboard data.
 * @returns A promise that resolves with an array of leaderboard entries.
 */
export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const storedLeaderboard = localStorage.getItem(LEADERBOARD_KEY);
    const leaderboard: LeaderboardEntry[] = storedLeaderboard ? JSON.parse(storedLeaderboard) : [];
    
    // Simulate fetching from an API
    return await fakeFetch(leaderboard);
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
    // Sort by points (desc), then by timestamp (desc) to break ties
    leaderboard.sort((a, b) => b.points - a.points || b.timestamp - a.timestamp);
    // Keep only the top entries
    leaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);

    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));

    // Simulate posting to an API
    return await fakeFetch(entryWithMetadata);
  } catch (e) {
    console.error("Failed to post score:", e);
    throw new Error("Could not submit score to the leaderboard.");
  }
};
