import { PlayerStats } from '../types';

const BASE_XP = 500;
const LEVEL_SCALING_FACTOR = 1.2;
const PLAYER_STATS_KEY_PREFIX = 'quizMasterPlayerStats_';

export const getXpForNextLevel = (level: number): number => {
  return Math.floor(BASE_XP * Math.pow(LEVEL_SCALING_FACTOR, level - 1));
};

const calculateLevelFromXp = (xp: number): number => {
  let level = 1;
  let xpForNext = getXpForNextLevel(level);
  while (xp >= xpForNext) {
    xp -= xpForNext;
    level++;
    xpForNext = getXpForNextLevel(level);
  }
  return level;
};

/**
 * Gets player stats from local storage, or returns default stats if not found.
 */
export const getPlayerStats = (userId: string): PlayerStats => {
  if (!userId) return { xp: 0, level: 1 };

  const key = `${PLAYER_STATS_KEY_PREFIX}${userId}`;
  const stored = localStorage.getItem(key);
  if (!stored) {
    return { xp: 0, level: 1 };
  }

  try {
    const stats = JSON.parse(stored) as PlayerStats;
    return stats;
  } catch (e) {
    console.warn("Could not fetch player stats for user:", userId, e);
    return { xp: 0, level: 1 };
  }
};

interface AddXpResult {
  newStats: PlayerStats;
  leveledUp: boolean;
  xpGained: number;
}

/**
 * Adds XP to a player's stats in local storage, checks for level ups, and saves the new stats.
 */
export const addXp = (userId: string, amount: number): AddXpResult => {
  if (!userId) {
    return { newStats: { xp: 0, level: 1 }, leveledUp: false, xpGained: 0 };
  }
  
  const currentStats = getPlayerStats(userId);
  
  let totalXpGained = amount;
  let newXp = currentStats.xp + amount;
  
  let previousLevel = currentStats.level;
  let newLevel = calculateLevelFromXp(newXp);

  while (newLevel > previousLevel) {
    const levelsGained = newLevel - previousLevel;
    const bonusXp = levelsGained * 1000;
    
    totalXpGained += bonusXp;
    newXp += bonusXp;

    previousLevel = newLevel;
    newLevel = calculateLevelFromXp(newXp);
  }

  const leveledUp = newLevel > currentStats.level;
  const newStats: PlayerStats = { xp: newXp, level: newLevel };

  // Save the new stats to local storage
  const key = `${PLAYER_STATS_KEY_PREFIX}${userId}`;
  localStorage.setItem(key, JSON.stringify(newStats));
  
  return { newStats, leveledUp, xpGained: totalXpGained };
};

export const getXpProgress = (stats: PlayerStats): { current: number, total: number } => {
  let totalXpForCurrentLevel = 0;
  for (let i = 1; i < stats.level; i++) {
    totalXpForCurrentLevel += getXpForNextLevel(i);
  }

  const xpIntoCurrentLevel = stats.xp - totalXpForCurrentLevel;
  const xpNeededForNextLevel = getXpForNextLevel(stats.level);

  return {
    current: xpIntoCurrentLevel,
    total: xpNeededForNextLevel,
  };
};