
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
import LeaderboardDisplay from './components/LeaderboardDisplay'; // Import LeaderboardDisplay

const LEADERBOARD_KEY = 'quizMasterLeaderboard';
const MAX_LEADERBOARD_ENTRIES = 10;

const App: React.FC = () => {
  const { t, i18n } = useTranslation(); // Destructure i18n here
  const [topic, setTopic] = useState<string>('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [score, setScore] = useState<number>(0);
  const [quizState, setQuizState] = useState<QuizState>(QuizState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);

  const handleGenerateQuiz = useCallback(async (currentTopic: string, currentDifficulty: Difficulty) => {
    setTopic(currentTopic);
    setDifficulty(currentDifficulty);
    setQuizState(QuizState.GENERATING);
    setError(null);
    try {
      const generatedQuestions = await generateQuizFromTopic(currentTopic, currentDifficulty);
      if (generatedQuestions && generatedQuestions.length > 0) {
        setQuestions(generatedQuestions);
        setScore(0); 
        setQuizState(QuizState.IN_PROGRESS);
      } else {
        setError(t('errorGeneratingNoQuestions')); // Use translation
        setQuizState(QuizState.ERROR);
      }
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : t('errorUnknownQuizGeneration'); // Use translation
      setError(errorMessage); 
      setQuizState(QuizState.ERROR);
    }
  }, [t]); // Add t to dependencies

  const saveScoreToLeaderboard = (currentTopic: string, currentScore: number, totalQuestions: number) => {
    const percentage = totalQuestions > 0 ? Math.round((currentScore / totalQuestions) * 100) : 0;
    const newEntry: LeaderboardEntry = {
      id: crypto.randomUUID(),
      topic: currentTopic,
      score: currentScore,
      totalQuestions,
      percentage,
      timestamp: Date.now(),
    };

    try {
      const storedLeaderboard = localStorage.getItem(LEADERBOARD_KEY);
      let leaderboard: LeaderboardEntry[] = storedLeaderboard ? JSON.parse(storedLeaderboard) : [];
      
      leaderboard.push(newEntry);
      // Sort by percentage descending, then by timestamp descending
      leaderboard.sort((a, b) => {
        if (b.percentage !== a.percentage) {
          return b.percentage - a.percentage;
        }
        return b.timestamp - a.timestamp;
      });

      // Keep only top N entries
      leaderboard = leaderboard.slice(0, MAX_LEADERBOARD_ENTRIES);
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard));
    } catch (e) {
      console.error("Failed to save score to leaderboard:", e);
    }
  };

  const handleQuizComplete = useCallback((finalScore: number, answeredQuestions: QuizQuestion[]) => {
    setScore(finalScore);
    setQuestions(answeredQuestions); 
    setQuizState(QuizState.COMPLETED);
    if (topic && answeredQuestions.length > 0) {
      saveScoreToLeaderboard(topic, finalScore, answeredQuestions.length);
    }
  }, [topic]); // topic is a dependency

  const handleRestart = useCallback(() => {
    setTopic('');
    setQuestions([]);
    setScore(0);
    setError(null);
    setQuizState(QuizState.IDLE);
  }, []);

  const handleViewLeaderboard = () => {
    setQuizState(QuizState.SHOW_LEADERBOARD);
  };
  
  const handleBackFromLeaderboard = () => {
    setQuizState(QuizState.IDLE);
  };


  useEffect(() => {
    // Add i18n keys for new error messages if not already present
    // This is a conceptual placeholder, actual error messages should be added to i18n.ts
    if (!i18n.exists('errorGeneratingNoQuestions')) {
      i18n.addResources('en', 'translation', { 
        errorGeneratingNoQuestions: "The AI couldn't generate a quiz for this topic. Please try a different one." 
      });
      i18n.addResources('sk', 'translation', { 
        errorGeneratingNoQuestions: "Umela inteligencia nedokázala pre túto tému vygenerovať kvíz. Skúste inú." 
      });
    }
    if (!i18n.exists('errorUnknownQuizGeneration')) {
       i18n.addResources('en', 'translation', { 
        errorUnknownQuizGeneration: "An unknown error occurred while generating the quiz."
      });
       i18n.addResources('sk', 'translation', { 
        errorUnknownQuizGeneration: "Pri generovaní kvízu sa vyskytla neznáma chyba."
      });
    }
  }, [t, i18n]); // Add i18n to dependency array


  const renderContent = () => {
    switch (quizState) {
      case QuizState.IDLE:
        return (
          <div className="w-full flex flex-col items-center">
            {/* FIX: The comparison 'quizState === QuizState.GENERATING' is always false inside this case block due to type narrowing. Pass 'false' directly. */}
            <TopicForm onGenerateQuiz={handleGenerateQuiz} isGenerating={false} />
          </div>
        );
      case QuizState.GENERATING:
        return <LoadingSpinner message={t('loadingMessageTopic', { topic })} />;
      case QuizState.IN_PROGRESS:
        return <QuizFlow questions={questions} onQuizComplete={handleQuizComplete} quizTopic={topic} />;
      case QuizState.COMPLETED:
        return <ResultsDisplay score={score} questions={questions} onRestart={handleRestart} quizTopic={topic} />;
      case QuizState.ERROR:
        return <ErrorDisplay message={error || "An unknown error occurred."} onRetry={handleRestart} />;
      case QuizState.SHOW_LEADERBOARD:
        return <LeaderboardDisplay onBack={handleBackFromLeaderboard} />;
      default:
        return null;
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
          <p className="text-sm text-slate-500">
            {t('poweredBy')} &copy; {new Date().getFullYear()} {t('footerRights')}.
          </p>
          <div className="flex items-center space-x-4">
            {quizState !== QuizState.SHOW_LEADERBOARD && quizState !== QuizState.GENERATING && quizState !== QuizState.IN_PROGRESS && (
              <button
                onClick={handleViewLeaderboard}
                className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                {t('viewLeaderboardButton')}
              </button>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;