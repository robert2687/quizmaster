
import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QuizQuestion, QuizState, LeaderboardEntry, Difficulty } from './types';
import { generateQuizFromTopic } from './services/geminiService';
import Header from './components/Header';
import TopicForm from './components/TopicForm';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorDisplay from './components/ErrorDisplay';
import QuizFlow from './components/QuizFlow';
import ResultsDisplay from './components/ResultsDisplay';
import LanguageSwitcher from './components/LanguageSwitcher';
import LeaderboardDisplay from './components/LeaderboardDisplay';
import PlayerNameSetup from './components/PlayerNameSetup';
import SoundToggle from './components/SoundToggle'; // Import the new component

const LEADERBOARD_KEY = 'quizMasterLeaderboard';
const PLAYER_NAME_KEY = 'quizMasterPlayerName';
const SOUND_ENABLED_KEY = 'quizMasterSoundEnabled';
const MAX_LEADERBOARD_ENTRIES = 10;

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [topic, setTopic] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [points, setPoints] = useState<number>(0);
  const [quizState, setQuizState] = useState<QuizState>(QuizState.GENERATING); // Start in a loading-like state
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(() => {
    const storedValue = localStorage.getItem(SOUND_ENABLED_KEY);
    return storedValue !== 'false'; // Default to true if not set or is 'true'
  });

  useEffect(() => {
    // On initial load, check for an existing player name
    const storedPlayerName = localStorage.getItem(PLAYER_NAME_KEY);
    if (storedPlayerName) {
      setPlayerName(storedPlayerName);
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
  }, [t]);

  const saveScoreToLeaderboard = useCallback((currentTopic: string, totalPoints: number) => {
    if (!playerName) return;

    const newEntry: LeaderboardEntry = {
      id: crypto.randomUUID(),
      playerName,
      topic: currentTopic,
      points: totalPoints,
      timestamp: Date.now(),
    };

    try {
      const storedLeaderboard = localStorage.getItem(LEADERBOARD_KEY);
      let leaderboard: LeaderboardEntry[] = storedLeaderboard ? JSON.parse(storedLeaderboard) : [];
      
      leaderboard.push(newEntry);
      leaderboard.sort((a, b) => b.points - a.points || b.timestamp - a.timestamp);

      leaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
    } catch (e) {
      console.error("Failed to save score to leaderboard:", e);
    }
  }, [playerName]);

  const handleQuizComplete = useCallback((totalPoints: number, answeredQuestions: QuizQuestion[]) => {
    setPoints(totalPoints);
    setQuestions(answeredQuestions); 
    setQuizState(QuizState.COMPLETED);
    if (topic && answeredQuestions.length > 0) {
      saveScoreToLeaderboard(topic, totalPoints);
    }
  }, [topic, saveScoreToLeaderboard]);

  const handleRestart = useCallback(() => {
    setTopic('');
    setQuestions([]);
    setPoints(0);
    setError(null);
    setQuizState(QuizState.IDLE);
  }, []);

  const handleViewLeaderboard = () => {
    setQuizState(QuizState.SHOW_LEADERBOARD);
  };
  
  const handleBackFromLeaderboard = () => {
    setQuizState(QuizState.IDLE);
  };

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
         // Only show topic if it's set, otherwise show default
        const message = topic ? t('loadingMessageTopic', { topic }) : t('loadingMessageDefault');
        return <LoadingSpinner message={message} />;
      case QuizState.IN_PROGRESS:
        return <QuizFlow questions={questions} onQuizComplete={handleQuizComplete} quizTopic={topic} difficulty={difficulty} isSoundEnabled={isSoundEnabled} />;
      case QuizState.COMPLETED:
        return <ResultsDisplay points={points} questions={questions} onRestart={handleRestart} quizTopic={topic} />;
      case QuizState.ERROR:
        return <ErrorDisplay message={error || "An unknown error occurred."} onRetry={handleRestart} />;
      case QuizState.SHOW_LEADERBOARD:
        return <LeaderboardDisplay onBack={handleBackFromLeaderboard} />;
      default:
        return <LoadingSpinner />; // Default loading state
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-start py-8 px-4">
      <Header />
      <main className="w-full flex-grow flex items-center justify-center mt-4 md:mt-0">
        {renderContent()}
      </main>
      <footer className="text-center py-4 mt-auto w-full max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <div className="text-sm text-slate-500">
             {playerName && quizState !== QuizState.PLAYER_SETUP && (
              <div className="mb-2 sm:mb-0">
                <span>{t('playingAs')} <strong>{playerName}</strong></span>
                <button onClick={handleChangePlayer} className="ml-2 text-purple-400 hover:text-purple-300 text-xs">
                  {t('changePlayer')}
                </button>
              </div>
            )}
            <p>
              {t('poweredBy')} &copy; {new Date().getFullYear()} {t('footerRights')}.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {quizState === QuizState.IDLE && (
              <button
                onClick={handleViewLeaderboard}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors px-2"
              >
                {t('viewLeaderboardButton')}
              </button>
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
