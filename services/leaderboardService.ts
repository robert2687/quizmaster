import { LeaderboardEntry, LeaderboardFilters } from '../types';
import { getDailyChallengeTopic } from './challengeService';

const LEADERBOARD_KEY = 'quizMasterLeaderboard';
const SIMULATED_DELAY = 250; // ms to simulate network latency

// A persistent cast of fake players to make the simulation feel more real.
const FAKE_PLAYERS = [
  { name: 'CosmicExplorer', avatar: 'avatar1', email: 'cosmic@example.com' },
  { name: 'QuizNinja', avatar: 'avatar2', email: 'ninja@example.com' },
  { name: 'HistoryBuff_99', avatar: 'avatar3', email: 'history@example.com' },
  { name: 'SciFi_Fanatic', avatar: 'avatar4', email: 'scifi@example.com' },
  { name: 'ArtLover22', avatar: 'avatar5', email: 'art@example.com' },
  { name: 'CodeWizard', avatar: 'avatar6', email: 'code@example.com' },
  { name: 'PixelPioneer', avatar: 'avatar1', email: 'pixel@example.com' },
  { name: 'DataDynamo', avatar: 'avatar2', email: 'data@example.com' },
  { name: 'LogicLeaper', avatar: 'avatar3', email: 'logic@example.com' },
  { name: 'TriviaTitan', avatar: 'avatar4', email: 'trivia@example.com' },
  { name: 'BrainyBard', avatar: 'avatar5', email: 'bard@example.com' },
];
const FAKE_TOPICS = ["The Solar System", "World War II History", "Famous Artists", "Roman Mythology", "Programming Languages", "Famous Movie Quotes", "Deep Sea Creatures", "Impressionist Painters", "The Roaring Twenties", "Classic Rock Bands", "World Geography Challenge"];


// FIX: Use ReturnType<typeof setInterval> for better type compatibility across environments (browser vs. Node).
let simulationInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Initializes the background simulation of leaderboard activity.
 * This should be called once when the application starts.
 */
export const initLeaderboardSimulation = () => {
    if (simulationInterval) {
        clearInterval(simulationInterval);
    }
    seedLeaderboardIfNeeded();
    // Run the simulation tick every so often to add new scores.
    simulationInterval = setInterval(_runSimulationTick, 8000); // every 8 seconds
}

/**
 * The core simulation logic that runs periodically.
 */
const _runSimulationTick = () => {
    const storedLeaderboard = localStorage.getItem(LEADERBOARD_KEY);
    let leaderboard: LeaderboardEntry[] = storedLeaderboard ? JSON.parse(storedLeaderboard) : [];
    
    // ~60% chance to add a new score to simulate other players
    if (Math.random() < 0.6) {
        const dailyChallengeTopic = getDailyChallengeTopic();

        const player = FAKE_PLAYERS[Math.floor(Math.random() * FAKE_PLAYERS.length)];
        // 50% chance the topic is the daily challenge, otherwise it's random
        const topic = Math.random() < 0.5 ? dailyChallengeTopic : FAKE_TOPICS[Math.floor(Math.random() * FAKE_TOPICS.length)];
        
        const newScore: LeaderboardEntry = {
            id: crypto.randomUUID(),
            playerName: player.name,
            userEmail: player.email, // Use stable email for fake players
            avatarId: player.avatar,
            topic: topic,
            points: Math.floor(Math.random() * 480) + 70, // Scores between 70 and 550
            timestamp: Date.now(),
        };
        leaderboard.push(newScore);
    }

    // Prune the leaderboard to keep it manageable and fresh.
    if (leaderboard.length > 150) {
        leaderboard.sort((a, b) => b.timestamp - a.timestamp); // Sort by most recent first
        leaderboard = leaderboard.slice(0, 100); // Keep the 100 most recent entries
    }

    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
};

/**
 * Simulates a network request with a delay.
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

const getSeasonStartDate = (): number => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.getTime();
}

const seedLeaderboardIfNeeded = () => {
  if (localStorage.getItem(LEADERBOARD_KEY)) return;

  const now = Date.now();
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const fakeEntries: LeaderboardEntry[] = [];
  const dailyChallengeTopic = getDailyChallengeTopic();

  for (let i = 0; i < 30; i++) {
    const player = FAKE_PLAYERS[i % FAKE_PLAYERS.length];
    const isDaily = i < 10; // Make sure the first 10 are for the daily challenge
    const topic = isDaily ? dailyChallengeTopic : FAKE_TOPICS[Math.floor(Math.random() * FAKE_TOPICS.length)];
    
    fakeEntries.push({
      id: crypto.randomUUID(),
      playerName: player.name,
      userEmail: player.email,
      avatarId: player.avatar,
      topic: topic,
      points: Math.floor(Math.random() * 450) + 50,
      timestamp: now - Math.floor(Math.random() * oneWeek * 2)
    });
  }
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(fakeEntries));
};

export const getLeaderboard = async (filters: LeaderboardFilters): Promise<LeaderboardEntry[]> => {
  try {
    const storedLeaderboard = localStorage.getItem(LEADERBOARD_KEY);
    let leaderboard: LeaderboardEntry[] = storedLeaderboard ? JSON.parse(storedLeaderboard) : [];
    
    let filteredData = leaderboard;

    if (filters.season === 'weekly') {
        const seasonStart = getSeasonStartDate();
        filteredData = filteredData.filter(entry => entry.timestamp >= seasonStart);
    }

    if (filters.topic && filters.topic.trim() !== '') {
        const lowercasedTopic = filters.topic.toLowerCase();
        filteredData = filteredData.filter(entry => entry.topic.toLowerCase().includes(lowercasedTopic));
    }

    filteredData.sort((a, b) => b.points - a.points || b.timestamp - a.timestamp);
    
    return await fakeFetch(filteredData);
  } catch (e) {
    console.error("Failed to get leaderboard:", e);
    throw new Error("Could not retrieve leaderboard data.");
  }
};

export const postScore = async (newEntry: Omit<LeaderboardEntry, 'id' | 'timestamp'>): Promise<LeaderboardEntry> => {
  const entryWithMetadata: LeaderboardEntry = {
    ...newEntry,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  try {
    const storedLeaderboard = localStorage.getItem(LEADERBOARD_KEY);
    let leaderboard: LeaderboardEntry[] = storedLeaderboard ? JSON.parse(storedLeaderboard) : [];
    
    // If this player already has a score for this topic, only keep the higher score.
    // This is more realistic for a competitive leaderboard.
    const existingScoreIndex = leaderboard.findIndex(e => e.userEmail === entryWithMetadata.userEmail && e.topic === entryWithMetadata.topic);
    
    if (existingScoreIndex !== -1) {
        if (leaderboard[existingScoreIndex].points < entryWithMetadata.points) {
            leaderboard[existingScoreIndex] = entryWithMetadata; // Update with higher score
        }
    } else {
        leaderboard.push(entryWithMetadata);
    }
    
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
    return await fakeFetch(entryWithMetadata);
  } catch (e) {
    console.error("Failed to post score:", e);
    throw new Error("Could not submit score to the leaderboard.");
  }
};