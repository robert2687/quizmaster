import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QuizQuestion, QuizState, Difficulty, QuizHistoryEntry, PlayerStats, ToastMessage, User, GroundingChunk, ChallengeStatus, ImagePayload } from './types';
import { generateQuizFromTopic } from './services/geminiService';
import { postScore } from './services/leaderboardService';
import { getDailyChallengeTopic, getChallengeStatus, completeDailyChallenge, CHALLENGE_BASE_XP_REWARD, CHALLENGE_STREAK_XP_BONUS_PER_DAY } from './services/challengeService';
import { getPlayerStats, addXp } from './services/playerStatsService';
import { checkAndUnlockAchievements } from './services/achievementsService';
import { isSupabaseConfigured } from './services/supabaseClient';
import Header from './components/Header';
import TopicForm from './components/TopicForm';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import QuizFlow from './components/QuizFlow';
import ResultsDisplay from './components/ResultsDisplay';
import LanguageSwitcher from './components/LanguageSwitcher';
import LeaderboardDisplay from './components/LeaderboardDisplay';
import SoundToggle from './components/SoundToggle';
import QuizHistoryDisplay from './components/QuizHistoryDisplay';
import PlayerStatsDisplay from './components/PlayerStatsDisplay';
import ToastContainer from './components/ToastContainer';
import TrophyIcon from './components/icons/TrophyIcon';
import SparklesIcon from './components/icons/SparklesIcon';
import LinkButton from './components/LinkButton';
import AchievementsDisplay from './components/AchievementsDisplay';
import PlayerNameSetup from './components/PlayerNameSetup';
import Avatar from './components/Avatar';
import DailyChallengeDisplay from './components/DailyChallengeDisplay';
import FireIcon from './components/icons/FireIcon';


const SOUND_ENABLED_KEY = 'quizMasterSoundEnabled';
const HISTORY_KEY_PREFIX = 'quizMasterHistory_';
const PLAYER_KEY = 'quizMasterPlayer';

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
  const [currentPlayer, setCurrentPlayer] = useState<User | null>(null);
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
    if (isSupabaseConfigured) {
      setDailyChallengeTopic(getDailyChallengeTopic());
    }
  }, []);

  // This effect handles the initial player setup flow.
  useEffect(() => {
    const storedPlayer = localStorage.getItem(PLAYER_KEY);
    if (storedPlayer) {
      const player = JSON.parse(storedPlayer) as User;
      setCurrentPlayer(player);
      const stats = getPlayerStats(player.id);
      setPlayerStats(stats);
      if (isSupabaseConfigured) {
        setChallengeStatus(getChallengeStatus(player.id));
      }
      setQuizState(QuizState.IDLE);
    } else {
      setQuizState(QuizState.PLAYER_SETUP);
    }
  }, []);


  const handleToggleSound = () => {
    setIsSoundEnabled(prev => !prev);
  };
  
  const handlePlayerSetupComplete = (playerName: string, avatar: string) => {
    const newPlayer: User = {
      id: crypto.randomUUID(),
      playerName,
      avatar,
    };
    localStorage.setItem(PLAYER_KEY, JSON.stringify(newPlayer));
    setCurrentPlayer(newPlayer);
    setPlayerStats(getPlayerStats(newPlayer.id)); // Will be default stats
    if (isSupabaseConfigured) {
        setChallengeStatus(getChallengeStatus(newPlayer.id));
    }
    setQuizState(QuizState.IDLE);
  };


  const handleGenerateQuiz = useCallback(async (
    topicOrContext: string, 
    currentDifficulty: Difficulty, 
    useGrounding: boolean, 
    isChallenge: boolean = false,
    imagePayload: ImagePayload | null = null
  ) => {
    if (!currentPlayer) return;
    setIsChallengeQuiz(isChallenge);
    setTopic(imagePayload ? (topicOrContext || t('imageQuizTopic')) : topicOrContext);
    setDifficulty(currentDifficulty);
    setQuizState(QuizState.GENERATING);
    setError(null);
    setSources(null);
    try {
      const { questions: generatedQuestions, sources: generatedSources } = await generateQuizFromTopic(topicOrContext, currentDifficulty, useGrounding, imagePayload);
      if (generatedQuestions && generatedQuestions.length > 0) {
        const xpForStarting = 10;
        const { newStats } = addXp(currentPlayer.id, xpForStarting);
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
  }, [t, currentPlayer, addToast]);

  const submitScoreToLeaderboard = useCallback(async (currentTopic: string, totalPoints: number) => {
    if (!currentPlayer || !isSupabaseConfigured) return;
    setIsSubmittingScore(true);
    try {
      await postScore({
        userId: currentPlayer.id,
        playerName: currentPlayer.playerName,
        avatarId: currentPlayer.avatar,
        topic: currentTopic,
        points: totalPoints,
      });
    } catch (e) {
      console.error("Failed to submit score:", e);
    } finally {
      setIsSubmittingScore(false);
    }
  }, [currentPlayer]);

  const saveQuizToHistory = useCallback((currentTopic: string, totalPoints: number, answeredQuestions: QuizQuestion[], currentDifficulty: Difficulty) => {
    if (!currentPlayer) return;
    const historyKey = `${HISTORY_KEY_PREFIX}${currentPlayer.id}`;
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
  }, [currentPlayer]);

  const handleQuizComplete = useCallback(async (totalPoints: number, answeredQuestions: QuizQuestion[]) => {
    if (!currentPlayer) return;
    
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
    if (isChallengeQuiz && isSupabaseConfigured) {
        const { newStreak } = completeDailyChallenge(currentPlayer.id);
        const baseBonus = CHALLENGE_BASE_XP_REWARD;
        const streakBonus = newStreak * CHALLENGE_STREAK_XP_BONUS_PER_DAY;
        totalXp += baseBonus + streakBonus;

        bonusInfo = { newStreak, baseBonus, streakBonus };
        setChallengeBonusInfo(bonusInfo);
        
        setChallengeStatus({ streak: newStreak, completedToday: true });
        addToast(t('dailyStreakMessage', { count: newStreak }), 'info', <FireIcon className="w-5 h-5 text-white" />);
    }


    const { newStats, leveledUp, xpGained } = addXp(currentPlayer.id, totalXp);
    setLastXpGained(xpGained);
    setPlayerStats(newStats);

    if (leveledUp) {
    addToast(t('levelUpMessage', { level: newStats.level }), 'success', <TrophyIcon className="w-5 h-5" />);
    }

    const newAchievements = checkAndUnlockAchievements({
    userId: currentPlayer.id,
    correctAnswers,
    totalQuestions,
    });

    newAchievements.forEach(ach => {
    addToast(t('achievementUnlockedTitle'), 'success', <TrophyIcon className="w-5 h-5" />);
    addToast(t(ach.nameKey), 'info');
    });

    submitScoreToLeaderboard(topic, totalPoints);
    
    saveQuizToHistory(topic, totalPoints, answeredQuestions, difficulty);
  }, [currentPlayer, submitScoreToLeaderboard, saveQuizToHistory, topic, difficulty, addToast, t, isChallengeQuiz]);

  const handleRestart = () => {
    setQuizState(QuizState.IDLE);
    setQuestions([]);
    setTopic('');
    setError(null);
    setIsChallengeQuiz(false);
    setChallengeBonusInfo(null);
  };

  const renderContent = () => {
    switch (quizState) {
      case QuizState.INITIALIZING:
        return <LoadingSpinner message={t('initializingApp')} />;
      case QuizState.PLAYER_SETUP:
        return <PlayerNameSetup onSetupComplete={handlePlayerSetupComplete} />;
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
        return <LeaderboardDisplay onBack={handleRestart} userId={currentPlayer?.id || null} title={leaderboardConfig?.title || t('leaderboardTitle')} topicFilter={leaderboardConfig?.topicFilter} />;
      case QuizState.SHOW_HISTORY:
        return <QuizHistoryDisplay onBack={handleRestart} playerIdentifier={currentPlayer?.id || null} />;
      case QuizState.SHOW_ACHIEVEMENTS:
        return <AchievementsDisplay onBack={handleRestart} playerIdentifier={currentPlayer?.id || null} />;
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
            {isSupabaseConfigured && (
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
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4 font-sans relative">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="w-full max-w-5xl mx-auto flex justify-between items-start pt-4 px-2 sm:px-4">
        <LanguageSwitcher />
        {currentPlayer ? (
          <div className="flex items-center gap-4">
            <PlayerStatsDisplay stats={playerStats} />
            <SoundToggle isSoundEnabled={isSoundEnabled} onToggle={handleToggleSound} />
          </div>
        ) : <div />}
      </div>
      
      <main className="flex-grow flex flex-col items-center justify-center w-full px-4 text-center">
        <Header />
        
        {currentPlayer && quizState === QuizState.IDLE && (
          <div className="mb-8 p-4 bg-slate-800 rounded-lg shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 w-full max-w-3xl">
            <div className="flex items-center gap-4 text-left">
              <Avatar avatarId={currentPlayer.avatar} className="w-12 h-12 rounded-full flex-shrink-0" />
              <div>
                <p className="text-sm text-slate-400">{t('playingAs')}</p>
                <p className="font-bold text-lg text-slate-100">
                  {currentPlayer.playerName}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              <LinkButton onClick={() => setQuizState(QuizState.SHOW_HISTORY)}>{t('viewHistoryButton')}</LinkButton>
              {isSupabaseConfigured && (
                <LinkButton onClick={() => { setLeaderboardConfig({ title: t('leaderboardTitle') }); setQuizState(QuizState.SHOW_LEADERBOARD); }}>{t('viewLeaderboardButton')}</LinkButton>
              )}
              <LinkButton onClick={() => setQuizState(QuizState.SHOW_ACHIEVEMENTS)}>{t('viewAchievementsButton')}</LinkButton>
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