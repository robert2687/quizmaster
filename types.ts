
export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  userAnswer?: string; // Text of the user's selected answer
}

export enum QuizState {
  INITIALIZING = 'initializing',
  PLAYER_SETUP = 'player_setup', // New state for one-time player name/avatar setup
  IDLE = 'idle',
  GENERATING = 'generating',
  IN_PROGRESS = 'inProgress',
  COMPLETED = 'completed',
  ERROR = 'error',
  SHOW_LEADERBOARD = 'show_leaderboard',
  SHOW_HISTORY = 'show_history',
  SHOW_ACHIEVEMENTS = 'show_achievements',
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
  id: number;
  userId: string;
  playerName: string;
  avatarId: string;
  topic: string;
  points: number;
  timestamp: number;
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
  id: string; // Locally stored UUID
  playerName: string;
  avatar: string;
  // FIX: Added missing properties to conform to usage in auth and profile components.
  email: string;
  bio: string;
  occupation: string | null;
}

export interface ChallengeStatus {
  streak: number;
  completedToday: boolean;
}

export interface ImagePayload {
  mimeType: string;
  data: string; // base64 encoded string
}
