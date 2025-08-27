
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer?: string; // Text of the user's selected answer
}

export enum QuizState {
  IDLE = 'idle',
  GENERATING = 'generating',
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  ERROR = 'error',
  SHOW_LEADERBOARD = 'show_leaderboard', // New state for showing leaderboard
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
}

export interface GroundingChunkWeb {
  uri: string;
  title: string;
}

export interface GroundingChunk {
  web: GroundingChunkWeb;
}

export interface LeaderboardEntry {
  id: string;
  topic: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  timestamp: number; // Unix timestamp
}