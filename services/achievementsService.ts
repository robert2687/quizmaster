import { Achievement, QuizHistoryEntry } from '../types';

const ACHIEVEMENTS_KEY_PREFIX = 'quizMasterAchievements_';
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
 * Gets the set of unlocked achievement IDs for a player from localStorage.
 */
export const getUnlockedAchievementIds = (playerName: string): Set<string> => {
  const key = `${ACHIEVEMENTS_KEY_PREFIX}${playerName}`;
  const stored = localStorage.getItem(key);
  return stored ? new Set(JSON.parse(stored)) : new Set();
};

/**
 * Saves the set of unlocked achievement IDs for a player to localStorage.
 */
const saveUnlockedAchievements = (playerName: string, unlockedIds: Set<string>) => {
  const key = `${ACHIEVEMENTS_KEY_PREFIX}${playerName}`;
  localStorage.setItem(key, JSON.stringify(Array.from(unlockedIds)));
};

interface CheckAchievementsParams {
  playerName: string;
  correctAnswers: number;
  totalQuestions: number;
}

/**
 * Checks for new achievements based on the latest quiz results and player history.
 * @returns An array of newly unlocked achievements.
 */
export const checkAndUnlockAchievements = (
  { playerName, correctAnswers, totalQuestions }: CheckAchievementsParams
): Achievement[] => {
  const unlockedIds = getUnlockedAchievementIds(playerName);
  const newlyUnlocked: Achievement[] = [];
  
  const historyKey = `${HISTORY_KEY_PREFIX}${playerName}`;
  const storedHistory = localStorage.getItem(historyKey);
  const history: QuizHistoryEntry[] = storedHistory ? JSON.parse(storedHistory) : [];

  // Check for 'FIRST_QUIZ'
  if (!unlockedIds.has(ALL_ACHIEVEMENTS.FIRST_QUIZ.id)) {
    // Since history is saved *after* this check, a history length of 0 means this is the first one.
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
    saveUnlockedAchievements(playerName, unlockedIds);
  }

  return newlyUnlocked;
};
