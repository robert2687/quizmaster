
import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QuizQuestion, QuizState, Difficulty, QuizHistoryEntry, PlayerStats, ToastMessage, User, GroundingChunk } from './types';
import { generateQuizFromTopic } from './services/geminiService';
import { postScore } from './services/leaderboardService';
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

const SOUND_ENABLED_KEY = 'quizMasterSoundEnabled';
const HISTORY_KEY_PREFIX = 'quizMasterHistory_';

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

  const saveQuizToHistory = useCallback((currentTopic: string, totalPoints: number, answeredQuestions: QuizQuestion[]) => {
    if (!currentUser) return;
    const correctAnswers = answeredQuestions.filter(q => q.userAnswer === q.correctAnswer).length;
    const totalQuestions = answeredQuestions.length;
    const newEntry: QuizHistoryEntry = {
      id: crypto.randomUUID(),
      topic: currentTopic,
      points: totalPoints,
      timestamp: Date.now(),
      difficulty: difficulty,
      correctAnswers: correctAnswers,
      totalQuestions: totalQuestions,
    };
    try {
      const historyKey = `${HISTORY_KEY_PREFIX}${currentUser.email}`;
      const storedHistory = localStorage.getItem(historyKey);
      let history: QuizHistoryEntry[] = storedHistory ? JSON.parse(storedHistory) : [];
      history.unshift(newEntry);
      localStorage.setItem(historyKey, JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save quiz to history:", e);
    }
  }, [currentUser, difficulty]);

  const handleQuizComplete = useCallback((totalPoints: number, answeredQuestions: QuizQuestion[]) => {
    if (!currentUser) return;
    const correctAnswers = answeredQuestions.filter(q => q.userAnswer === q.correctAnswer).length;
    const totalQuestions = answeredQuestions.length;
    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    
    const newAchievements = checkAndUnlockAchievements({
      email: currentUser.email,
      correctAnswers,
      totalQuestions,
    });
    newAchievements.forEach(ach => {
      addToast(
        `${t('achievementUnlockedTitle')} ${t(ach.nameKey)}`,
        'success',
        <TrophyIcon className="w-6 h-6" />
      );
    });
    
    const answerXp = correctAnswers * 25;
    const perfectScoreBonus = percentage === 100 ? 500 : 0;
    const totalXpGainedFromQuiz = answerXp + perfectScoreBonus;
    
    const { newStats, leveledUp, xpGained } = addXp(currentUser.email, totalXpGainedFromQuiz);
    setPlayerStats(newStats);
    setLastXpGained(xpGained);

    if (leveledUp) {
      addToast(
        `${t('levelUpTitle')} ${t('levelUpMessage', { level: newStats.level })}`,
        'success',
        <SparklesIcon className="w-6 h-6" />
      );
    }
    

    setPoints(totalPoints);
    setQuestions(answeredQuestions); 
    setQuizState(QuizState.COMPLETED);

    if (topic && answeredQuestions.length > 0) {
      submitScoreToLeaderboard(topic, totalPoints);
      saveQuizToHistory(topic, totalPoints, answeredQuestions);
    }
  }, [topic, submitScoreToLeaderboard, saveQuizToHistory, currentUser, addToast, t]);

  const handleRestart = useCallback(() => {
    setTopic('');
    setQuestions([]);
    setPoints(0);
    setError(null);
    setSources(null);
    setQuizState(QuizState.IDLE);
    setLastXpGained(0);
  }, []);

  const handleOccupationSelected = async (occupation: string) => {
    if (!currentUser) return;
    try {
      const updatedUser = await authService.updateUserProfile(currentUser.email, { occupation });
      setCurrentUser(updatedUser);
      addToast(t('profileUpdatedSuccess'), 'success');
      setQuizState(QuizState.IDLE);
    } catch (error) {
      console.error('Failed to update occupation', error);
      // Even if it fails, let's proceed to the app
      setQuizState(QuizState.IDLE);
    }
  };

  const handleSkipOccupation = () => {
    setQuizState(QuizState.IDLE);
  };

  const handleProfileUpdate = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setQuizState(QuizState.IDLE);
    addToast(t('profileUpdatedSuccess'), 'success');
  };

  const handleGoToProfile = () => setQuizState(QuizState.EDIT_PROFILE);
  const handleCancelProfileUpdate = () => setQuizState(QuizState.IDLE);
  const handleViewLeaderboard = () => setQuizState(QuizState.SHOW_LEADERBOARD);
  const handleBackToIdle = () => setQuizState(QuizState.IDLE);
  const handleViewHistory = () => setQuizState(QuizState.SHOW_HISTORY);
  const handleViewAchievements = () => setQuizState(QuizState.SHOW_ACHIEVEMENTS);


  const renderContent = () => {
    switch (quizState) {
      case QuizState.AUTH:
        return <AuthFlow onAuthSuccess={handleAuthSuccess} />;
      case QuizState.PROFILE_SETUP:
        return <OccupationSelector onSelect={handleOccupationSelected} onSkip={handleSkipOccupation} />;
      case QuizState.IDLE:
        return <TopicForm onGenerateQuiz={handleGenerateQuiz} isGenerating={false} />;
      case QuizState.GENERATING:
        const message = topic ? t('loadingMessageTopic', { topic }) : t('loadingMessageDefault');
        return <LoadingSpinner message={message} />;
      case QuizState.IN_PROGRESS:
        return <QuizFlow questions={questions} onQuizComplete={handleQuizComplete} quizTopic={topic} difficulty={difficulty} isSoundEnabled={isSoundEnabled} />;
      case QuizState.COMPLETED:
        return <ResultsDisplay points={points} questions={questions} onRestart={handleRestart} quizTopic={topic} isSubmittingScore={isSubmittingScore} xpGained={lastXpGained} sources={sources} />;
      case QuizState.ERROR:
        return <ErrorDisplay message={error || "An unknown error occurred."} onRetry={handleRestart} />;
      case QuizState.SHOW_LEADERBOARD:
        return <LeaderboardDisplay onBack={handleBackToIdle} userEmail={currentUser?.email ?? null} />;
      case QuizState.SHOW_HISTORY:
        return <QuizHistoryDisplay onBack={handleBackToIdle} playerIdentifier={currentUser?.email ?? null} />;
      case QuizState.SHOW_ACHIEVEMENTS:
        return <AchievementsDisplay onBack={handleBackToIdle} playerIdentifier={currentUser?.email ?? null} />;
      case QuizState.EDIT_PROFILE:
        return currentUser && <ProfileEditor currentUser={currentUser} onProfileUpdate={handleProfileUpdate} onCancel={handleCancelProfileUpdate} />;
      default:
        return <LoadingSpinner />;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start py-8 px-4">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <Header />
      <main className="w-full flex-grow flex items-center justify-center mt-4 md:mt-0">
        {renderContent()}
      </main>
      <footer className="text-center py-4 mt-auto w-full max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="flex-grow text-left">
             {currentUser && quizState !== QuizState.AUTH && (
              <div className="mb-2 flex items-center gap-4">
                <Avatar avatarId={currentUser.avatar} className="w-12 h-12 rounded-full flex-shrink-0" />
                <div className="flex-grow">
                  <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="font-bold text-slate-100">{currentUser.playerName}</span>
                      <LinkButton onClick={handleGoToProfile} className="text-xs px-1">{t('editProfileButton')}</LinkButton>
                      <LinkButton onClick={handleLogout} className="text-xs px-1">{t('logoutButton')}</LinkButton>
                  </div>
                  {playerStats && <PlayerStatsDisplay stats={playerStats} />}
                </div>
              </div>
            )}
            <p className="mt-2 text-center sm:text-left text-sm text-slate-500">
              {t('poweredBy')} &copy; {new Date().getFullYear()} {t('footerRights')}.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {quizState === QuizState.IDLE && (
              <>
                <LinkButton
                  onClick={handleViewLeaderboard}
                  className="text-sm px-3 py-1"
                >
                  {t('viewLeaderboardButton')}
                </LinkButton>
                <LinkButton
                  onClick={handleViewHistory}
                  className="text-sm px-3 py-1"
                >
                  {t('viewHistoryButton')}
                </LinkButton>
                <LinkButton
                  onClick={handleViewAchievements}
                  className="text-sm px-3 py-1"
                >
                  {t('viewAchievementsButton')}
                </LinkButton>
              </>
            )}
            <SoundToggle isSoundEnabled={isSoundEnabled} onToggle={handleToggleSound} />
            <LanguageSwitcher />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;