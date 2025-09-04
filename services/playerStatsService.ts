import { PlayerStats } from '../types';

const STATS_KEY_PREFIX = 'quizMasterStats_';
const BASE_XP = 500;
const LEVEL_SCALING_FACTOR = 1.2;

/**
 * Calculates the XP required to advance from a given level to the next.
 * @param level The current level.
 * @returns The amount of XP needed to reach the next level.
 */
export const getXpForNextLevel = (level: number): number => {
  return Math.floor(BASE_XP * Math.pow(LEVEL_SCALING_FACTOR, level - 1));
};

/**
 * Calculates the player's level based on their total XP.
 * @param xp The player's total experience points.
 * @returns The calculated level.
 */
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
 * Gets player stats from localStorage, or returns default stats.
 */
export const getPlayerStats = (playerName: string): PlayerStats => {
  const key = `${STATS_KEY_PREFIX}${playerName}`;
  const stored = localStorage.getItem(key);
  if (stored) {
    return JSON.parse(stored);
  }
  return { xp: 0, level: 1 };
};

/**
 * Saves player stats to localStorage.
 */
const savePlayerStats = (playerName: string, stats: PlayerStats) => {
  const key = `${STATS_KEY_PREFIX}${playerName}`;
  localStorage.setItem(key, JSON.stringify(stats));
};

interface AddXpResult {
  newStats: PlayerStats;
  leveledUp: boolean;
  xpGained: number;
}

/**
 * Adds XP to a player's stats, checks for level ups, and saves the new stats.
 */
export const addXp = (playerName: string, amount: number): AddXpResult => {
  if (!playerName) {
    return { newStats: { xp: 0, level: 1 }, leveledUp: false, xpGained: 0 };
  }
  const currentStats = getPlayerStats(playerName);
  
  let totalXpGained = amount;
  let newXp = currentStats.xp + amount;
  
  let previousLevel = currentStats.level;
  let newLevel = calculateLevelFromXp(newXp);

  // If a level up occurs, add bonus XP and re-calculate.
  // This loop handles multiple level-ups from a single large XP gain.
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
  savePlayerStats(playerName, newStats);

  return { newStats, leveledUp, xpGained: totalXpGained };
};

/**
 * Calculates the current XP progress towards the next level.
 * @param stats The player's current stats.
 * @returns An object with current progress and total needed for next level.
 */
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