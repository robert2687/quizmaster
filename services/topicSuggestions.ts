// A curated list of popular and engaging quiz topics to suggest to users.
const popularTopics: string[] = [
  "World Capitals",
  "Famous Landmarks",
  "Classic Literature",
  "The Solar System",
  "Human Anatomy",
  "World War II History",
  "Basics of Quantum Physics",
  "The Marvel Cinematic Universe",
  "Famous Inventors",
  "Ancient Greek Mythology",
  "Roman Mythology",
  "Norse Mythology",
  "Programming Languages",
  "The Lord of the Rings",
  "Harry Potter Universe",
  "Star Wars Saga",
  "The Office (US)",
  "Friends (TV Show)",
  "Pop Music of the 90s",
  "Famous Artists",
  "Dinosaurs",
  "Oceanography",
  "Video Game History",
  "US Presidents",
  "World Geography",
  "Chemistry Basics",
  "Famous Movie Quotes",
  "The Beatles",
  "Shakespeare's Plays",
  "Olympic Games History",
  "Types of Cheese",
  "International Cuisine",
];

/**
 * Filters the list of popular topics based on a user's query.
 * @param query The user's input string.
 * @returns An array of matching topic suggestions, limited to 5 results.
 */
export const getTopicSuggestions = (query: string): string[] => {
  if (!query) {
    return [];
  }
  const lowercasedQuery = query.toLowerCase();
  return popularTopics
    .filter(topic => topic.toLowerCase().includes(lowercasedQuery))
    .slice(0, 5); // Return a maximum of 5 suggestions for a clean UI
};
