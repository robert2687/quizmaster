import { Achievement, QuizHistoryEntry } from '../types';
import { supabase } from './supabaseClient';

const HISTORY_KEY_PREFIX = 'quizMasterHistory_';

// Define all possible achievements in the game
export const ALL_ACHIEVEMENTS: Record<string, Achievement> = {
  FIRST_QUIZ: {
    id: 'FIRST_QUIZ',
    nameKey: 'achievementFirstQuizName',
    descriptionKey: 'achievementFirstQuizDescription',
  },
  PERFECTIONIST: {
    id: 'PERFECTIONIST',
    nameKey: 'achievementPerfectionistName',
    descriptionKey: 'achievementPerfectionistDescription',
  },
};

/**
 * Gets the set of unlocked achievement IDs for a player from their Supabase profile.
 */
export const getUnlockedAchievementIds = async (userId: string): Promise<Set<string>> => {
  if (!userId) return new Set();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('unlocked_achievements')
    .eq('id', userId)
    .single();

  if (error || !data || !data.unlocked_achievements) {
    console.warn("Could not get unlocked achievements:", error?.message);
    return new Set();
  }
  
  return new Set(data.unlocked_achievements);
};

/**
 * Saves the array of unlocked achievement IDs for a player to their Supabase profile.
 */
const saveUnlockedAchievements = async (userId: string, unlockedIds: Set<string>) => {
  const achievementsArray = Array.from(unlockedIds);
  const { error } = await supabase
    .from('profiles')
    .update({ unlocked_achievements: achievementsArray })
    .eq('id', userId);
  
  if (error) {
    console.error("Failed to save unlocked achievements:", error);
  }
};

interface CheckAchievementsParams {
  userId: string;
  correctAnswers: number;
  totalQuestions: number;
}

/**
 * Checks for new achievements based on the latest quiz results and player history.
 * @returns An array of newly unlocked achievements.
 */
export const checkAndUnlockAchievements = async (
  { userId, correctAnswers, totalQuestions }: CheckAchievementsParams
): Promise<Achievement[]> => {
  const unlockedIds = await getUnlockedAchievementIds(userId);
  const newlyUnlocked: Achievement[] = [];
  
  // History is still in localStorage, so we can check it synchronously.
  const historyKey = `${HISTORY_KEY_PREFIX}${userId}`;
  const storedHistory = localStorage.getItem(historyKey);
  const history: QuizHistoryEntry[] = storedHistory ? JSON.parse(storedHistory) : [];

  // Check for 'FIRST_QUIZ'
  if (!unlockedIds.has(ALL_ACHIEVEMENTS.FIRST_QUIZ.id)) {
    // A history length of 0 means this is the first one just completed.
    if (history.length === 0) {
      newlyUnlocked.push(ALL_ACHIEVEMENTS.FIRST_QUIZ);
      unlockedIds.add(ALL_ACHIEVEMENTS.FIRST_QUIZ.id);
    }
  }
  
  // Check for 'PERFECTIONIST'
  if (!unlockedIds.has(ALL_ACHIEVEMENTS.PERFECTIONIST.id)) {
    if (correctAnswers === totalQuestions && totalQuestions > 0) {
      newlyUnlocked.push(ALL_ACHIEVEMENTS.PERFECTIONIST);
      unlockedIds.add(ALL_ACHIEVEMENTS.PERFECTIONIST.id);
    }
  }

  if (newlyUnlocked.length > 0) {
    await saveUnlockedAchievements(userId, unlockedIds);
  }

  return newlyUnlocked;
};