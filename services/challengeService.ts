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
