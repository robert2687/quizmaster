import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QuizQuestion, QuizState, Difficulty, QuizHistoryEntry, PlayerStats, ToastMessage, User, GroundingChunk } from './types';
import { generateQuizFromTopic } from './services/geminiService';
import { postScore } from './services/leaderboardService';
import { getDailyChallengeTopic } from './services/challengeService';
import { getPlayerStats, addXp } from './services/playerStatsService';
import { checkAndUnlockAchievements } from './services/achievementsService';
import * as authService from './services/authService';
import Header from './components/Header';
import TopicForm from './components/TopicForm';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import QuizFlow from './components/QuizFlow';
import ResultsDisplay from './components/ResultsDisplay';
import LanguageSwitcher from './components/LanguageSwitcher';
import LeaderboardDisplay from './components/LeaderboardDisplay';
import AuthFlow from './components/AuthFlow';
import SoundToggle from './components/SoundToggle';
import QuizHistoryDisplay from './components/QuizHistoryDisplay';
import PlayerStatsDisplay from './components/PlayerStatsDisplay';
import ToastContainer from './components/ToastContainer';
import TrophyIcon from './components/icons/TrophyIcon';
import SparklesIcon from './components/icons/SparklesIcon';
import LinkButton from './components/LinkButton';
import Button from './components/Button';
import AchievementsDisplay from './components/AchievementsDisplay';
import ProfileEditor from './components/ProfileEditor';
import Avatar from './components/Avatar';
import OccupationSelector from './components/OccupationSelector';

const SOUND_ENABLED_KEY = 'quizMasterSoundEnabled';
const HISTORY_KEY_PREFIX = 'quizMasterHistory_';

// Define the shape for the leaderboard modal's configuration
interface LeaderboardConfig {
  topicFilter?: string;
  title: string;
}

const App: React.FC = () => {
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [topic, setTopic] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [sources, setSources] = useState<GroundingChunk[] | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [quizState, setQuizState] = useState<QuizState>(QuizState.GENERATING); // Start in a loading state
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [isSubmittingScore, setIsSubmittingScore] = useState<boolean>(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    const storedValue = localStorage.getItem(SOUND_ENABLED_KEY);
    return storedValue !== 'false';
  });
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [lastXpGained, setLastXpGained] = useState<number>(0);
  const [dailyChallengeTopic, setDailyChallengeTopic] = useState<string>('');
  const [leaderboardConfig, setLeaderboardConfig] = useState<LeaderboardConfig | null>(null);


  const addToast = useCallback((message: string, type: 'success' | 'info', icon?: React.ReactNode) => {
    const id = crypto.randomUUID();
    setToasts(prev => [...prev, { id, message, type, icon }]);
    setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    setDailyChallengeTopic(getDailyChallengeTopic());

    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setPlayerStats(getPlayerStats(user.email));
      setQuizState(QuizState.IDLE);
    } else {
      setQuizState(QuizState.AUTH);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SOUND_ENABLED_KEY, String(isSoundEnabled));
  }, [isSoundEnabled]);

  const handleToggleSound = () => {
    setIsSoundEnabled(prev => !prev);
  };

  const handleAuthSuccess = (user: User, isNewUser: boolean) => {
    setCurrentUser(user);
    setPlayerStats(getPlayerStats(user.email));
    if (isNewUser) {
        setQuizState(QuizState.PROFILE_SETUP);
    } else {
        setQuizState(QuizState.IDLE);
    }
  };
  
  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setPlayerStats(null);
    setQuizState(QuizState.AUTH);
  };

  const handleGenerateQuiz = useCallback(async (currentTopic: string, currentDifficulty: Difficulty, useGrounding: boolean) => {
    if (!currentUser) return;
    setTopic(currentTopic);
    setDifficulty(currentDifficulty);
    setQuizState(QuizState.GENERATING);
    setError(null);
    setSources(null);
    try {
      const { questions: generatedQuestions, sources: generatedSources } = await generateQuizFromTopic(currentTopic, currentDifficulty, useGrounding, currentUser.occupation);
      if (generatedQuestions && generatedQuestions.length > 0) {
        const xpForStarting = 10;
        const { newStats } = addXp(currentUser.email, xpForStarting);
        setPlayerStats(newStats);
        addToast(t('xpForStartingQuiz', { xp: xpForStarting }), 'info', <SparklesIcon className="w-5 h-5" />);

        setQuestions(generatedQuestions);
        setSources(generatedSources);
        setPoints(0); 
        setQuizState(QuizState.IN_PROGRESS);
      } else {
        setError(t('errorGeneratingNoQuestions'));
        setQuizState(QuizState.ERROR);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : t('errorUnknownQuizGeneration');
      setError(errorMessage); 
      setQuizState(QuizState.ERROR);
    }
  }, [t, currentUser, addToast]);

  const submitScoreToLeaderboard = useCallback(async (currentTopic: string, totalPoints: number) => {
    if (!currentUser) return;
    setIsSubmittingScore(true);
    try {
      await postScore({
        playerName: currentUser.playerName,
        userEmail: currentUser.email,
        avatarId: currentUser.avatar,
        topic: currentTopic,
        points: totalPoints,
      });
    } catch (e) {
      console.error("Failed to submit score:", e);
    } finally {
      setIsSubmittingScore(false);
    }
  }, [currentUser]);

  const saveQuizToHistory = useCallback((currentTopic: string