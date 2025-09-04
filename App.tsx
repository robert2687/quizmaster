import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QuizQuestion, QuizState, Difficulty, QuizHistoryEntry, PlayerStats, ToastMessage, Achievement } from './types';
import { generateQuizFromTopic } from './services/geminiService';
import { postScore } from './services/leaderboardService';
import { getPlayerStats, addXp } from './services/playerStatsService';
import { checkAndUnlockAchievements } from './services/achievementsService';
import Header from './components/Header';
import TopicForm from './components/TopicForm';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import QuizFlow from './components/QuizFlow';
import ResultsDisplay from './components/ResultsDisplay';
import LanguageSwitcher from './components/LanguageSwitcher';
import LeaderboardDisplay from './components/LeaderboardDisplay';
import PlayerNameSetup from './components/PlayerNameSetup';
import SoundToggle from './components/SoundToggle';
import QuizHistoryDisplay from './components/QuizHistoryDisplay';
import PlayerStatsDisplay from './components/PlayerStatsDisplay';
import ToastContainer from './components/ToastContainer';
import TrophyIcon from './components/icons/TrophyIcon';
import SparklesIcon from './components/icons/SparklesIcon';
import LinkButton from './components/LinkButton';
import AchievementsDisplay from './components/AchievementsDisplay';

const PLAYER_NAME_KEY = 'quizMasterPlayerName';
const SOUND_ENABLED_KEY = 'quizMasterSoundEnabled';
const HISTORY_KEY_PREFIX = 'quizMasterHistory_';

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [topic, setTopic] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [points, setPoints] = useState<number>(0);
  const [quizState, setQuizState] = useState<QuizState>(QuizState.GENERATING);
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
    const storedPlayerName = localStorage.getItem(PLAYER_NAME_KEY);
    if (storedPlayerName) {
      setPlayerName(storedPlayerName);
      setPlayerStats(getPlayerStats(storedPlayerName));
      setQuizState(QuizState.IDLE);
    } else {
      setQuizState(QuizState.PLAYER_SETUP);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(SOUND_ENABLED_KEY, String(isSoundEnabled));
  }, [isSoundEnabled]);

  const handleToggleSound = () => {
    setIsSoundEnabled(prev => !prev);
  };

  const handleSetPlayerName = (name: string) => {
    setPlayerName(name);
    localStorage.setItem(PLAYER_NAME_KEY, name);
    setPlayerStats(getPlayerStats(name));
    setQuizState(QuizState.IDLE);
  };
  
  const handleChangePlayer = () => {
      setQuizState(QuizState.PLAYER_SETUP);
  };

  const handleGenerateQuiz = useCallback(async (currentTopic: string, currentDifficulty: Difficulty) => {
    setTopic(currentTopic);
    setDifficulty(currentDifficulty);
    setQuizState(QuizState.GENERATING);
    setError(null);
    try {
      const generatedQuestions = await generateQuizFromTopic(currentTopic, currentDifficulty);
      if (generatedQuestions && generatedQuestions.length > 0) {
        if (playerName) {
          const xpForStarting = 10;
          const { newStats } = addXp(playerName, xpForStarting);
          setPlayerStats(newStats);
          addToast(t('xpForStartingQuiz', { xp: xpForStarting }), 'info', <SparklesIcon className="w-5 h-5" />);
        }
        setQuestions(generatedQuestions);
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
  }, [t, playerName, addToast]);

  const submitScoreToLeaderboard = useCallback(async (currentTopic: string, totalPoints: number) => {
    if (!playerName) return;
    setIsSubmittingScore(true);
    try {
      await postScore({
        playerName,
        topic: currentTopic,
        points: totalPoints,
      });
    } catch (e) {
      console.error("Failed to submit score:", e);
    } finally {
      setIsSubmittingScore(false);
    }
  }, [playerName]);

  const saveQuizToHistory = useCallback((currentTopic: string, totalPoints: number, answeredQuestions: QuizQuestion[]) => {
    if (!playerName) return;
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
      const historyKey = `${HISTORY_KEY_PREFIX}${playerName}`;
      const storedHistory = localStorage.getItem(historyKey);
      let history: QuizHistoryEntry[] = storedHistory ? JSON.parse(storedHistory) : [];
      history.unshift(newEntry);
      localStorage.setItem(historyKey, JSON.stringify(history));
    } catch (e) {
      console.error("Failed to save quiz to history:", e);
    }
  }, [playerName, difficulty]);

  const handleQuizComplete = useCallback((totalPoints: number, answeredQuestions: QuizQuestion[]) => {
    const correctAnswers = answeredQuestions.filter(q => q.userAnswer === q.correctAnswer).length;
    const totalQuestions = answeredQuestions.length;
    const percentage = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;

    if (playerName) {
      const newAchievements = checkAndUnlockAchievements({
        playerName,
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
      
      const { newStats, leveledUp, xpGained } = addXp(playerName, totalXpGainedFromQuiz);
      setPlayerStats(newStats);
      setLastXpGained(xpGained); // Use the final calculated XP including bonuses

      if (leveledUp) {
        addToast(
          `${t('levelUpTitle')} ${t('levelUpMessage', { level: newStats.level })}`,
          'success',
          <SparklesIcon className="w-6 h-6" />
        );
      }
    }

    setPoints(totalPoints);
    setQuestions(answeredQuestions); 
    setQuizState(QuizState.COMPLETED);

    if (topic && answeredQuestions.length > 0) {
      submitScoreToLeaderboard(topic, totalPoints);
      saveQuizToHistory(topic, totalPoints, answeredQuestions);
    }
  }, [topic, submitScoreToLeaderboard, saveQuizToHistory, playerName, addToast, t]);

  const handleRestart = useCallback(() => {
    setTopic('');
    setQuestions([]);
    setPoints(0);
    setError(null);
    setQuizState(QuizState.IDLE);
    setLastXpGained(0);
  }, []);

  const handleViewLeaderboard = () => setQuizState(QuizState.SHOW_LEADERBOARD);
  const handleBackFromLeaderboard = () => setQuizState(QuizState.IDLE);
  const handleViewHistory = () => setQuizState(QuizState.SHOW_HISTORY);
  const handleBackFromHistory = () => setQuizState(QuizState.IDLE);
  const handleViewAchievements = () => setQuizState(QuizState.SHOW_ACHIEVEMENTS);
  const handleBackFromAchievements = () => setQuizState(QuizState.IDLE);


  const renderContent = () => {
    switch (quizState) {
      case QuizState.PLAYER_SETUP:
        return <PlayerNameSetup onNameSubmit={handleSetPlayerName} />;
      case QuizState.IDLE:
        return (
          <div className="w-full flex flex-col items-center">
            <TopicForm onGenerateQuiz={handleGenerateQuiz} isGenerating={false} />
          </div>
        );
      case QuizState.GENERATING:
        const message = topic ? t('loadingMessageTopic', { topic }) : t('loadingMessageDefault');
        return <LoadingSpinner message={message} />;
      case QuizState.IN_PROGRESS:
        return <QuizFlow questions={questions} onQuizComplete={handleQuizComplete} quizTopic={topic} difficulty={difficulty} isSoundEnabled={isSoundEnabled} />;
      case QuizState.COMPLETED:
        return <ResultsDisplay points={points} questions={questions} onRestart={handleRestart} quizTopic={topic} isSubmittingScore={isSubmittingScore} xpGained={lastXpGained} />;
      case QuizState.ERROR:
        return <ErrorDisplay message={error || "An unknown error occurred."} onRetry={handleRestart} />;
      case QuizState.SHOW_LEADERBOARD:
        return <LeaderboardDisplay onBack={handleBackFromLeaderboard} playerName={playerName} />;
      case QuizState.SHOW_HISTORY:
        return <QuizHistoryDisplay onBack={handleBackFromHistory} playerName={playerName} />;
      case QuizState.SHOW_ACHIEVEMENTS:
        return <AchievementsDisplay onBack={handleBackFromAchievements} playerName={playerName} />;
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
          <div className="text-sm text-slate-500 flex-grow">
             {playerName && quizState !== QuizState.PLAYER_SETUP && (
              <div className="mb-2 sm:mb-0 flex flex-col sm:flex-row items-center sm:space-x-4 space-y-2 sm:space-y-0">
                <div className="flex-shrink-0">
                    <span>{t('playingAs')} <strong>{playerName}</strong></span>
                    <LinkButton onClick={handleChangePlayer} className="ml-2 text-xs px-1">
                      {t('changePlayer')}
                    </LinkButton>
                </div>
                {playerStats && <PlayerStatsDisplay stats={playerStats} />}
              </div>
            )}
            <p className="mt-2 text-center sm:text-left">
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