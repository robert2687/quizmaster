export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer?: string; // Text of the user's selected answer
}

export enum QuizState {
  PLAYER_SETUP = 'player_setup', // New state for initial player name entry
  IDLE = 'idle',
  GENERATING = 'generating',
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  ERROR = 'error',
  SHOW_LEADERBOARD = 'show_leaderboard',
  SHOW_HISTORY = 'show_history',
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
  playerName: string;
  topic: string;
  points: number;
  timestamp: number; // Unix timestamp
}

export interface QuizHistoryEntry {
  id:string;
  topic: string;
  points: number;
  timestamp: number;
  difficulty: Difficulty;
  correctAnswers: number;
  totalQuestions: number;
}

// New types for gamification
export interface PlayerStats {
  xp: number;
  level: number;
}

export interface Achievement {
  id: 'PERFECTIONIST' | 'FIRST_QUIZ';
  nameKey: string;
  descriptionKey: string;
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info';
  icon?: React.ReactNode;
}