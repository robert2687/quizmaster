import { Achievement, QuizHistoryEntry } from '../types';

const HISTORY_KEY_PREFIX = 'quizMasterHistory_';
const ACHIEVEMENTS_KEY_PREFIX = 'quizMasterAchievements_';

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
 * Gets the set of unlocked achievement IDs for a player from local storage.
 */
export const getUnlockedAchievementIds = (userId: string): Set<string> => {
  if (!userId) return new Set();
  
  const key = `${ACHIEVEMENTS_KEY_PREFIX}${userId}`;
  const stored = localStorage.getItem(key);

  if (!stored) {
    return new Set();
  }
  
  try {
    const ids = JSON.parse(stored) as string[];
    return new Set(ids);
  } catch (e) {
    console.warn("Could not parse unlocked achievements:", e);
    return new Set();
  }
};

/**
 * Saves the array of unlocked achievement IDs for a player to local storage.
 */
const saveUnlockedAchievements = (userId: string, unlockedIds: Set<string>) => {
  const key = `${ACHIEVEMENTS_KEY_PREFIX}${userId}`;
  const achievementsArray = Array.from(unlockedIds);
  localStorage.setItem(key, JSON.stringify(achievementsArray));
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
export const checkAndUnlockAchievements = (
  { userId, correctAnswers, totalQuestions }: CheckAchievementsParams
): Achievement[] => {
  const unlockedIds = getUnlockedAchievementIds(userId);
  const newlyUnlocked: Achievement[] = [];
  
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
    saveUnlockedAchievements(userId, unlockedIds);
  }

  return newlyUnlocked;
};