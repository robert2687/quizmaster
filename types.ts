
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer?: string; // Text of the user's selected answer
}

export enum QuizState {
  AUTH = 'auth', // New state for login/signup
  PROFILE_SETUP = 'profile_setup', // New state for post-signup setup
  IDLE = 'idle',
  GENERATING = 'generating',
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  ERROR = 'error',
  SHOW_LEADERBOARD = 'show_leaderboard',
  SHOW_HISTORY = 'show_history',
  SHOW_ACHIEVEMENTS = 'show_achievements',
  EDIT_PROFILE = 'edit_profile',
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
}

// FIX: Made properties optional to match the @google/genai SDK types.
export interface GroundingChunkWeb {
  uri?: string;
  title?: string;
}

// FIX: Made 'web' property optional to match the @google/genai SDK types.
export interface GroundingChunk {
  web?: GroundingChunkWeb;
}

export interface LeaderboardEntry {
  id: string;
  playerName: string;
  userEmail: string; // To uniquely identify the user
  avatarId: string; // To display the user's avatar
  topic: string;
  points: number;
  timestamp: number; // Unix timestamp
}

export interface LeaderboardFilters {
  season: 'weekly' | 'all-time';
  topic: string;
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

export interface User {
  email: string;
  playerName: string;
  avatar: string;
  bio: string;
  occupation?: string;
}

export interface ChallengeStatus {
  streak: number;
  completedToday: boolean;
}
