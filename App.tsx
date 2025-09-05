import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QuizQuestion, QuizState, Difficulty, QuizHistoryEntry, PlayerStats, ToastMessage, User, GroundingChunk, ChallengeStatus, ImagePayload } from './types';
import { generateQuizFromTopic } from './services/geminiService';
import { postScore } from './services/leaderboardService';
import { getDailyChallengeTopic, getChallengeStatus, completeDailyChallenge, CHALLENGE_BASE_XP_REWARD, CHALLENGE_STREAK_XP_BONUS_PER_DAY } from './services/challengeService';
import { getPlayerStats, addXp } from './services/playerStatsService';
import { checkAndUnlockAchievements } from './services/achievementsService';
import * as authService from './services/authService';
import { supabase, isSupabaseConfigured } from './services/supabaseClient';
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
import AchievementsDisplay from './components/AchievementsDisplay';
import ProfileEditor from './components/ProfileEditor';
import Avatar from './components/Avatar';
import OccupationSelector from './components/OccupationSelector';
import DailyChallengeDisplay from './components/DailyChallengeDisplay';
import FireIcon from './components/icons/FireIcon';
import PasswordResetForm from './components/PasswordResetForm';

const SOUND_ENABLED_KEY = 'quizMasterSoundEnabled';
const HISTORY_KEY_PREFIX = 'quizMasterHistory_';

// Define the shape for the leaderboard modal's configuration
interface LeaderboardConfig {
  topicFilter?: string;
  title: string;
}

interface ChallengeBonusInfo {
    baseBonus: number;
    streakBonus: number;
    newStreak: number;
}

const App: React.FC = () => {
  const { t } = useTranslation();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [topic, setTopic] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [sources, setSources] = useState<GroundingChunk[] | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [quizState, setQuizState] = useState<QuizState>(QuizState.INITIALIZING); // Start in an initializing state
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
  const [challengeStatus, setChallengeStatus] = useState<ChallengeStatus | null>(null);
  const [isChallengeQuiz, setIsChallengeQuiz] = useState(false);
  const [challengeBonusInfo, setChallengeBonusInfo] = useState<ChallengeBonusInfo | null>(null);


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
  
  // This effect manages the sound setting persistence.
  useEffect(() => {
    localStorage.setItem(SOUND_ENABLED_KEY, String(isSoundEnabled));
  }, [isSoundEnabled]);

  // This effect sets up the daily challenge topic once on mount.
  useEffect(() => {
    setDailyChallengeTopic(getDailyChallengeTopic());
  }, []);

  // This effect handles all authentication logic, including setup and state changes.
  // It runs only once when the component mounts.
  useEffect(() => {
    // If Supabase is not configured, we cannot perform any online actions.
    // The UI will default to the login/signup screen. Any attempt to use
    // auth features will be caught by the authService, which will
    // throw a user-friendly error, preventing network calls.
    if (!isSupabaseConfigured) {
      setQuizState(QuizState.AUTH);
      return; // Stop execution of this effect.
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (_event === 'PASSWORD_RECOVERY') {
        setQuizState(QuizState.PASSWORD_RESET);
        return; // Stop further processing for this event
      }

      if (session?.user) {
        const userProfile = await authService.getUserProfile(session.user.id);
        if (userProfile) {
          setCurrentUser(userProfile);
          const stats = await getPlayerStats(userProfile.id);
          setPlayerStats(stats);
          setChallengeStatus(getChallengeStatus(userProfile.id));

          // This is now the single source of truth for state transitions after auth changes.
          setQuizState((currentQuizState) => {
            const isAuthScreen = currentQuizState === QuizState.AUTH || currentQuizState === QuizState.INITIALIZING || currentQuizState === QuizState.PASSWORD_RESET;
            if (isAuthScreen) {
              // If user just verified, their occupation won't be set yet. Route them to profile setup.
              return !userProfile.occupation ? QuizState.PROFILE_SETUP : QuizState.IDLE;
            }
            // Don't change state if user is already in the app (e.g., in a quiz).
            return currentQuizState;
          });
        } else {
          // This can happen if profile creation failed after signup. Log them out.
          await authService.logout();
          setCurrentUser(null);
          setQuizState(QuizState.AUTH);
        }
      } else {
        // Logged out state
        setCurrentUser(null);
        setPlayerStats(null);
        setChallengeStatus(null);
        setQuizState((currentQuizState) => {
            if (currentQuizState !== QuizState.PASSWORD_RESET) {
                return QuizState.AUTH;
            }
            return currentQuizState;
        });
      }
    });

    // Check initial session on app load
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setQuizState(QuizState.AUTH);
      }
    };
    checkInitialSession();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleToggleSound = () => {
    setIsSoundEnabled(prev => !prev);
  };

  const handleAuthSuccess = async (user: User) => {
    // The onAuthStateChange listener is the source of truth for state transitions.
    // This handler simply ensures the UI has the latest user data immediately after manual login.
    setCurrentUser(user);
    const stats = await getPlayerStats(user.id);
    setPlayerStats(stats);
    setChallengeStatus(getChallengeStatus(user.id));
  };
  
  const handleLogout = async () => {
    await authService.logout();
    // onAuthStateChange will handle the state updates
  };

  const handleGenerateQuiz = useCallback(async (
    topicOrContext: string, 
    currentDifficulty: Difficulty, 
    useGrounding: boolean, 
    isChallenge: boolean = false,
    imagePayload: ImagePayload | null = null
  ) => {
    if (!currentUser) return;
    setIsChallengeQuiz(isChallenge);
    setTopic(imagePayload ? (topicOrContext || t('imageQuizTopic')) : topicOrContext);
    setDifficulty(currentDifficulty);
    setQuizState(QuizState.GENERATING);
    setError(null);
    setSources(null);
    try {
      const { questions: generatedQuestions, sources: generatedSources } = await generateQuizFromTopic(topicOrContext, currentDifficulty, useGrounding, currentUser.occupation, imagePayload);
      if (generatedQuestions && generatedQuestions.length > 0) {
        const xpForStarting = 10;
        const { newStats } = await addXp(currentUser.id, xpForStarting);
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
        userId: currentUser.id,
        playerName: currentUser.playerName,
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

  const saveQuizToHistory = useCallback((currentTopic: string, totalPoints: number, answeredQuestions: QuizQuestion[], currentDifficulty: Difficulty) => {
    if (!currentUser) return;
    const historyKey = `${HISTORY_KEY_PREFIX}${currentUser.id}`;
    const newEntry: QuizHistoryEntry = {
      id: crypto.randomUUID(),
      topic: currentTopic,
      points: totalPoints,
      timestamp: Date.now(),
      difficulty: currentDifficulty,
      correctAnswers: answeredQuestions.filter(q => q.userAnswer === q.correctAnswer).length,
      totalQuestions: answeredQuestions.length,
    };

    const storedHistory = localStorage.getItem(historyKey);
    let history: QuizHistoryEntry[] = [];
    if (storedHistory) {
      try {
        history = JSON.parse(storedHistory);
      } catch (e) {
        console.error("Could not parse quiz history", e);
      }
    }
    history.unshift(newEntry); // Add to the beginning
    localStorage.setItem(historyKey, JSON.stringify(history.slice(0, 50))); // Keep last 50
  }, [currentUser]);

  const handleQuizComplete = useCallback(async (totalPoints: number, answeredQuestions: QuizQuestion[]) => {
    if (!currentUser) return;
    
    setPoints(totalPoints);
    setQuestions(answeredQuestions);
    setQuizState(QuizState.COMPLETED);

    const correctAnswers = answeredQuestions.filter(q => q.userAnswer === q.correctAnswer).length;
    const totalQuestions = answeredQuestions.length;
    const xpFromPoints = totalPoints;
    const completionBonus = 50;
    const perfectionBonus = correctAnswers === totalQuestions ? 200 : 0;
    let totalXp = xpFromPoints + completionBonus + perfectionBonus;
    
    let bonusInfo: ChallengeBonusInfo | null = null;
    if (isChallengeQuiz) {
        const { newStreak } = completeDailyChallenge(currentUser.id);
        const baseBonus = CHALLENGE_BASE_XP_REWARD;
        const streakBonus = newStreak * CHALLENGE_STREAK_XP_BONUS_PER_DAY;
        totalXp += baseBonus + streakBonus;

        bonusInfo = { newStreak, baseBonus, streakBonus };
        setChallengeBonusInfo(bonusInfo);
        
        setChallengeStatus({ streak: newStreak, completedToday: true });
        addToast(t('dailyStreakMessage', { count: newStreak }), 'info', <FireIcon className="w-5 h-5 text-white" />);
    }


    const { newStats, leveledUp, xpGained } = await addXp(currentUser.id, totalXp);
    setLastXpGained(xpGained);
    setPlayerStats(newStats);

    if (leveledUp) {
      addToast(t('levelUpMessage', { level: newStats.level }), 'success', <TrophyIcon className="w-5 h-5" />);
    }

    const newAchievements = await checkAndUnlockAchievements({
      userId: currentUser.id,
      correctAnswers,
      totalQuestions,
    });

    newAchievements.forEach(ach => {
      addToast(t('achievementUnlockedTitle'), 'success', <TrophyIcon className="w-5 h-5" />);
      addToast(t(ach.nameKey), 'info');
    });

    submitScoreToLeaderboard(topic, totalPoints);
    saveQuizToHistory(topic, totalPoints, answeredQuestions, difficulty);
  }, [currentUser, submitScoreToLeaderboard, saveQuizToHistory, topic, difficulty, addToast, t, isChallengeQuiz]);

  const handleRestart = () => {
    setQuizState(QuizState.IDLE);
    setQuestions([]);
    setTopic('');
    setError(null);
    setIsChallengeQuiz(false);
    setChallengeBonusInfo(null);
  };

  const handleProfileUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    addToast(t('profileUpdatedSuccess'), 'success');
    setQuizState(QuizState.IDLE);
  };

  const handleProfileSetupComplete = async (occupation: string) => {
    if (!currentUser) return;
    try {
        const updatedUser = await authService.updateUserProfile(currentUser.id, { occupation });
        setCurrentUser(updatedUser);
        setQuizState(QuizState.IDLE);
    } catch(err) {
        console.error(err);
    }
  };

  const renderContent = () => {
    switch (quizState) {
      case QuizState.INITIALIZING:
        return <LoadingSpinner message={t('initializingApp')} />;
      case QuizState.AUTH:
        return <AuthFlow onAuthSuccess={handleAuthSuccess} />;
      case QuizState.PASSWORD_RESET:
        return <PasswordResetForm onPasswordUpdated={() => addToast(t('passwordUpdateSuccess'), 'success')} />;
      case QuizState.PROFILE_SETUP:
        return currentUser && <OccupationSelector onSelect={handleProfileSetupComplete} onSkip={() => setQuizState(QuizState.IDLE)} />;
      case QuizState.EDIT_PROFILE:
        return currentUser && <ProfileEditor currentUser={currentUser} onProfileUpdate={handleProfileUpdate} onCancel={() => setQuizState(QuizState.IDLE)} />;
      case QuizState.GENERATING:
        return <LoadingSpinner message={t('loadingMessageTopic', { topic })} />;
      case QuizState.IN_PROGRESS:
        return (
          <QuizFlow
            questions={questions}
            onQuizComplete={handleQuizComplete}
            quizTopic={topic}
            difficulty={difficulty}
            isSoundEnabled={isSoundEnabled}
          />
        );
      case QuizState.COMPLETED:
        return (
          <ResultsDisplay
            points={points}
            questions={questions}
            onRestart={handleRestart}
            quizTopic={topic}
            isSubmittingScore={isSubmittingScore}
            xpGained={lastXpGained}
            sources={sources}
            challengeBonusInfo={challengeBonusInfo}
          />
        );
      case QuizState.ERROR:
        return <ErrorDisplay message={error || t('errorUnknownQuizGeneration')} onRetry={handleRestart} />;
      case QuizState.SHOW_LEADERBOARD:
        return leaderboardConfig && <LeaderboardDisplay onBack={handleRestart} userId={currentUser?.id || null} title={leaderboardConfig.title} topicFilter={leaderboardConfig.topicFilter} />;
      case QuizState.SHOW_HISTORY:
        return <QuizHistoryDisplay onBack={handleRestart} playerIdentifier={currentUser?.id || null} />;
      case QuizState.SHOW_ACHIEVEMENTS:
        return <AchievementsDisplay onBack={handleRestart} playerIdentifier={currentUser?.id || null} />;
      case QuizState.IDLE:
      default:
        return (
          <div className="w-full max-w-lg">
            <TopicForm 
              onGenerateQuiz={(topicOrContext, difficulty, useGrounding, imagePayload) => 
                handleGenerateQuiz(topicOrContext, difficulty, useGrounding, false, imagePayload)
              } 
              isGenerating={false} 
            />
            <DailyChallengeDisplay
              dailyChallengeTopic={dailyChallengeTopic}
              challengeStatus={challengeStatus}
              onPlay={(topic, difficulty, useGrounding, isChallenge) => 
                handleGenerateQuiz(topic, difficulty, useGrounding, isChallenge, null)
              }
              onViewLeaderboard={() => {
                setLeaderboardConfig({ title: t('dailyChallengeLeaderboardTitle'), topicFilter: dailyChallengeTopic });
                setQuizState(QuizState.SHOW_LEADERBOARD);
              }}
            />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4 font-sans relative">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="w-full max-w-5xl mx-auto flex justify-between items-start pt-4 px-2 sm:px-4">
        <LanguageSwitcher />
        {currentUser ? (
          <div className="flex items-center gap-4">
            <PlayerStatsDisplay stats={playerStats} />
            <SoundToggle isSoundEnabled={isSoundEnabled} onToggle={handleToggleSound} />
          </div>
        ) : <div />}
      </div>
      
      <main className="flex-grow flex flex-col items-center justify-center w-full px-4 text-center">
        <Header />
        
        {currentUser && quizState === QuizState.IDLE && (
          <div className="mb-8 p-4 bg-slate-800 rounded-lg shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-3xl">
            <div className="flex items-center gap-4 text-left">
              <Avatar avatarId={currentUser.avatar} className="w-12 h-12 rounded-full flex-shrink-0" />
              <div>
                <p className="text-sm text-slate-400">{t('playingAs')}</p>
                <p className="font-bold text-lg text-slate-100">{currentUser.playerName}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <LinkButton onClick={() => setQuizState(QuizState.SHOW_HISTORY)}>{t('viewHistoryButton')}</LinkButton>
              <LinkButton onClick={() => { setLeaderboardConfig({ title: t('leaderboardTitle') }); setQuizState(QuizState.SHOW_LEADERBOARD); }}>{t('viewLeaderboardButton')}</LinkButton>
              <LinkButton onClick={() => setQuizState(QuizState.SHOW_ACHIEVEMENTS)}>{t('viewAchievementsButton')}</LinkButton>
              <LinkButton onClick={() => setQuizState(QuizState.EDIT_PROFILE)}>{t('editProfileButton')}</LinkButton>
              <LinkButton onClick={handleLogout}>{t('logoutButton')}</LinkButton>
            </div>
          </div>
        )}

        {renderContent()}

      </main>

      <footer className="w-full text-center py-4 text-slate-500 text-xs">
        <p>&copy; {new Date().getFullYear()} {t('footerRights')}. {t('poweredBy')}</p>
      </footer>
    </div>
  );
};

export default App;