

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QuizQuestion, QuizState, Difficulty, QuizHistoryEntry, PlayerStats, ToastMessage, User, GroundingChunk, ChallengeStatus } from './types';
import { generateQuizFromTopic } from './services/geminiService';
import { postScore } from './services/leaderboardService';
import { getDailyChallengeTopic, getChallengeStatus, completeDailyChallenge, CHALLENGE_BASE_XP_REWARD, CHALLENGE_STREAK_XP_BONUS_PER_DAY } from './services/challengeService';
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
import AchievementsDisplay from './components/AchievementsDisplay';
import ProfileEditor from './components/ProfileEditor';
import Avatar from './components/Avatar';
import OccupationSelector from './components/OccupationSelector';
import DailyChallengeDisplay from './components/DailyChallengeDisplay';
import FireIcon from './components/icons/FireIcon';

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

  useEffect(() => {
    setDailyChallengeTopic(getDailyChallengeTopic());

    const user = authService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setPlayerStats(getPlayerStats(user.email));
      setChallengeStatus(getChallengeStatus(user.email));
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
    setChallengeStatus(getChallengeStatus(user.email));
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
    setChallengeStatus(null);
    setQuizState(QuizState.AUTH);
  };

  const handleGenerateQuiz = useCallback(async (currentTopic: string, currentDifficulty: Difficulty, useGrounding: boolean, isChallenge: boolean = false) => {
    if (!currentUser) return;
    setIsChallengeQuiz(isChallenge);
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

  const saveQuizToHistory = useCallback((currentTopic: string, totalPoints: number, answeredQuestions: QuizQuestion[], currentDifficulty: Difficulty) => {
    if (!currentUser) return;
    const historyKey = `${HISTORY_KEY_PREFIX}${currentUser.email}`;
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

  const handleQuizComplete = useCallback((totalPoints: number, answeredQuestions: QuizQuestion[]) => {
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
        const { newStreak } = completeDailyChallenge(currentUser.email);
        const baseBonus = CHALLENGE_BASE_XP_REWARD;
        const streakBonus = newStreak * CHALLENGE_STREAK_XP_BONUS_PER_DAY;
        totalXp += baseBonus + streakBonus;

        bonusInfo = { newStreak, baseBonus, streakBonus };
        setChallengeBonusInfo(bonusInfo);
        
        setChallengeStatus({ streak: newStreak, completedToday: true });
        addToast(t('dailyStreakMessage', { count: newStreak }), 'info', <FireIcon className="w-5 h-5 text-white" />);
    }


    const { newStats, leveledUp, xpGained } = addXp(currentUser.email, totalXp);
    setLastXpGained(xpGained);
    setPlayerStats(newStats);

    if (leveledUp) {
      addToast(t('levelUpMessage', { level: newStats.level }), 'success', <TrophyIcon className="w-5 h-5" />);
    }

    const newAchievements = checkAndUnlockAchievements({
      email: currentUser.email,
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

  const handleProfileSetupComplete = (occupation: string) => {
    if (!currentUser) return;
    authService.updateUserProfile(currentUser.email, { occupation })
      .then(updatedUser => {
        setCurrentUser(updatedUser);
        setQuizState(QuizState.IDLE);
      })
      .catch(console.error);
  };

  const renderContent = () => {
    switch (quizState) {
      case QuizState.AUTH:
        return <AuthFlow onAuthSuccess={handleAuthSuccess} />;
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
        return leaderboardConfig && <LeaderboardDisplay onBack={handleRestart} userEmail={currentUser?.email || null} title={leaderboardConfig.title} topicFilter={leaderboardConfig.topicFilter} />;
      case QuizState.SHOW_HISTORY:
        return <QuizHistoryDisplay onBack={handleRestart} playerIdentifier={currentUser?.email || null} />;
      case QuizState.SHOW_ACHIEVEMENTS:
        return <AchievementsDisplay onBack={handleRestart} playerIdentifier={currentUser?.email || null} />;
      case QuizState.IDLE:
      default:
        return (
          <div className="w-full max-w-lg">
            <TopicForm onGenerateQuiz={(...args) => handleGenerateQuiz(...args, false)} isGenerating={false} />
            <DailyChallengeDisplay
              dailyChallengeTopic={dailyChallengeTopic}
              challengeStatus={challengeStatus}
              onPlay={handleGenerateQuiz}
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
            <div className="flex flex-wrap items-center justify-center gap-2">
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
