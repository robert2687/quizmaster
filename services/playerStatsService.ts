import { PlayerStats } from '../types';
import { supabase } from './supabaseClient';

const BASE_XP = 500;
const LEVEL_SCALING_FACTOR = 1.2;

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
 * Gets player stats from Supabase, or returns default stats if not found.
 */
export const getPlayerStats = async (userId: string): Promise<PlayerStats> => {
  if (!userId) return { xp: 0, level: 1 };
  
  const { data, error } = await supabase
    .from('profiles')
    .select('xp, level')
    .eq('id', userId)
    .single();
  
  if (error || !data) {
    console.warn("Could not fetch player stats for user:", userId, error?.message);
    return { xp: 0, level: 1 };
  }
  return { xp: data.xp || 0, level: data.level || 1 };
};

interface AddXpResult {
  newStats: PlayerStats;
  leveledUp: boolean;
  xpGained: number;
}

/**
 * Adds XP to a player's stats in Supabase, checks for level ups, and saves the new stats.
 */
export const addXp = async (userId: string, amount: number): Promise<AddXpResult> => {
  if (!userId) {
    return { newStats: { xp: 0, level: 1 }, leveledUp: false, xpGained: 0 };
  }
  
  const currentStats = await getPlayerStats(userId);
  
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

  // Save the new stats to Supabase
  const { error } = await supabase
    .from('profiles')
    .update({ xp: newStats.xp, level: newStats.level })
    .eq('id', userId);

  if (error) {
    console.error("Failed to save player stats:", error);
    // Return original stats if save fails, to avoid UI inconsistency
    return { newStats: currentStats, leveledUp: false, xpGained: 0 };
  }

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