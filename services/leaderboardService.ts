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
 * Populates the leaderboard with fake data if it doesn't exist,
 * simulating an active online community for new users.
 */
const seedLeaderboardIfNeeded = () => {
  const storedLeaderboard = localStorage.getItem(LEADERBOARD_KEY);
  if (storedLeaderboard === null) { // Seed only if it's completely empty
    const fakePlayers = [
      { name: 'CosmicExplorer', avatar: 'avatar1' },
      { name: 'QuizNinja', avatar: 'avatar2' },
      { name: 'HistoryBuff_99', avatar: 'avatar3' },
      { name: 'SciFi_Fanatic', avatar: 'avatar4' },
      { name: 'ArtLover22', avatar: 'avatar5' },
      { name: 'CodeWizard', avatar: 'avatar6' },
    ];
    const fakeTopics = ["The Solar System", "World War II History", "Famous Artists", "Roman Mythology", "Programming Languages", "Famous Movie Quotes"];

    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    const fakeEntries: LeaderboardEntry[] = [];

    for (let i = 0; i < 20; i++) {
      const player = fakePlayers[Math.floor(Math.random() * fakePlayers.length)];
      const topic = fakeTopics[Math.floor(Math.random() * fakeTopics.length)];
      fakeEntries.push({
        id: crypto.randomUUID(),
        playerName: player.name,
        userEmail: `${player.name.toLowerCase()}@example.com`,
        avatarId: player.avatar,
        topic: topic,
        points: Math.floor(Math.random() * 450) + 50, // Score between 50 and 500
        timestamp: now - Math.floor(Math.random() * oneWeek * 2) // Within the last two weeks
      });
    }
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(fakeEntries));
  }
};


/**
 * Fetches the leaderboard data, with optional filtering.
 * @returns A promise that resolves with an array of leaderboard entries.
 */
export const getLeaderboard = async (filters: LeaderboardFilters): Promise<LeaderboardEntry[]> => {
  try {
    seedLeaderboardIfNeeded(); // Ensure we have some data to show
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
    seedLeaderboardIfNeeded(); // Ensure leaderboard exists before adding to it
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