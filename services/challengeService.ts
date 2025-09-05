import { ChallengeStatus } from '../types';

// A curated list of engaging topics for the Daily Challenge.
const DAILY_CHALLENGE_TOPICS: string[] = [
  "Famous Scientists and their Discoveries",
  "World Geography: Rivers and Mountains",
  "Classic Hollywood Cinema",
  "The Seven Wonders of the Ancient World",
  "Innovations of the Industrial Revolution",
  "The Art of the Renaissance",
  "Legendary Creatures in Mythology",
  "Pioneers of Computer Science",
  "The Human Brain",
  "Famous Philosophical Concepts",
  "The History of Jazz Music",
  "Architectural Marvels",
  "Culinary Capitals of the World",
  "Exploring the Amazon Rainforest",
  "The Space Race",
  "Ancient Egyptian Pharaohs",
  "Iconic Sports Moments",
  "The Great Wall of China's History",
  "The Works of William Shakespeare",
  "Fundamentals of Chess Strategy",
  "The Silk Road: Ancient Trade Routes",
  "The Periodic Table of Elements",
];

// Key for storing challenge data in localStorage
const CHALLENGE_KEY_PREFIX = 'quizMasterChallenge_';

export const CHALLENGE_BASE_XP_REWARD = 250;
export const CHALLENGE_STREAK_XP_BONUS_PER_DAY = 50;


/**
 * Checks if a given timestamp is from today.
 */
const isSameDay = (timestamp: number, date: Date): boolean => {
  const otherDate = new Date(timestamp);
  return (
    otherDate.getDate() === date.getDate() &&
    otherDate.getMonth() === date.getMonth() &&
    otherDate.getFullYear() === date.getFullYear()
  );
};

/**
 * Checks if a given timestamp is from yesterday.
 */
const isYesterday = (timestamp: number, date: Date): boolean => {
  const yesterday = new Date(date);
  yesterday.setDate(yesterday.getDate() - 1);
  return isSameDay(timestamp, yesterday);
};

/**
 * Gets the challenge status for a player (streak and if today's is completed).
 */
export const getChallengeStatus = (email: string): ChallengeStatus => {
  const key = `${CHALLENGE_KEY_PREFIX}${email}`;
  const stored = localStorage.getItem(key);

  if (!stored) {
    return { streak: 0, completedToday: false };
  }
  
  try {
    const data = JSON.parse(stored);
    const completedToday = isSameDay(data.lastCompletionTimestamp, new Date());
    return { streak: data.streak || 0, completedToday };
  } catch (e) {
    console.error("Failed to parse challenge status:", e);
    return { streak: 0, completedToday: false };
  }
};

/**
 * Updates challenge status after a successful completion.
 * Increments streak if last completion was yesterday, otherwise resets to 1.
 */
export const completeDailyChallenge = (email: string): { newStreak: number } => {
  const key = `${CHALLENGE_KEY_PREFIX}${email}`;
  const status = getChallengeStatus(email);
  
  // Should not happen if called correctly, but as a safeguard.
  if (status.completedToday) {
    return { newStreak: status.streak };
  }

  const today = new Date();
  const stored = localStorage.getItem(key);
  let lastCompletionTimestamp = 0;
  if(stored) {
      try {
          lastCompletionTimestamp = JSON.parse(stored).lastCompletionTimestamp || 0;
      } catch (e) {}
  }

  const newStreak = isYesterday(lastCompletionTimestamp, today) ? status.streak + 1 : 1;
  
  const newData = {
    streak: newStreak,
    lastCompletionTimestamp: today.getTime(),
  };
  
  localStorage.setItem(key, JSON.stringify(newData));
  
  return { newStreak };
};

/**
 * Gets the deterministic topic for the current day's challenge.
 * The topic is selected from the list based on the day of the year.
 * @returns The topic string for the daily challenge.
 */
export const getDailyChallengeTopic = (): string => {
  // Use a fixed start date to ensure the sequence is stable.
  const startDate = new Date('2024-01-01T00:00:00Z');
  const today = new Date();
  
  // Calculate the number of full days that have passed since the start date.
  const diffTime = today.getTime() - startDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Use the modulo operator to cycle through the topics array.
  const topicIndex = diffDays % DAILY_CHALLENGE_TOPICS.length;
  
  return DAILY_CHALLENGE_TOPICS[topicIndex];
};
