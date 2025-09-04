
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { QuizQuestion, Difficulty } from '../types';
import QuestionDisplay from './QuestionDisplay';
import ProgressBar from './ProgressBar';
import Timer from './Timer';
import { playSound } from '../services/soundService';

interface QuizFlowProps {
  questions: QuizQuestion[];
  onQuizComplete: (totalPoints: number, answeredQuestions: QuizQuestion[]) => void;
  quizTopic: string;
  difficulty: Difficulty;
  isSoundEnabled: boolean;
}

const getTimeForDifficulty = (difficulty: Difficulty): number => {
  switch (difficulty) {
    case Difficulty.EASY:
      return 25;
    case Difficulty.MEDIUM:
      return 20;
    case Difficulty.HARD:
      return 15;
    default:
      return 20; // Default to medium
  }
};


const QuizFlow: React.FC<QuizFlowProps> = ({ questions, onQuizComplete, quizTopic, difficulty, isSoundEnabled }) => {
  const { t } = useTranslation();
  const timePerQuestion = getTimeForDifficulty(difficulty);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(undefined);
  const [answeredQuestions, setAnsweredQuestions] = useState<QuizQuestion[]>(
    questions.map(q => ({ ...q, userAnswer: undefined }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(timePerQuestion);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentQuestion = answeredQuestions[currentIndex];

  const handleNextStep = useCallback((answer?: string) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsSubmitting(true);

    const isCorrect = answer === currentQuestion.correctAnswer;
    
    playSound(isCorrect ? 'correct' : 'incorrect', isSoundEnabled);

    const pointsThisTurn = isCorrect
      ? (difficulty === Difficulty.EASY ? 10 : difficulty === Difficulty.MEDIUM ? 20 : 30) + timeLeft
      : 0;

    if (isCorrect) {
      setTotalPoints(prev => prev + pointsThisTurn);
    }

    const updatedQuestion = { ...currentQuestion, userAnswer: answer };
    const newAnsweredQuestions = [...answeredQuestions];
    newAnsweredQuestions[currentIndex] = updatedQuestion;
    setAnsweredQuestions(newAnsweredQuestions);

    setTimeout(() => {
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            setSelectedOption(undefined);
            setIsSubmitting(false);
        } else {
            playSound('complete', isSoundEnabled);
            // Use totalPoints (from before this question) + pointsThisTurn to get final score
            onQuizComplete(totalPoints + pointsThisTurn, newAnsweredQuestions);
        }
    }, 1200);
  }, [answeredQuestions, currentIndex, currentQuestion, totalPoints, onQuizComplete, questions.length, difficulty, timeLeft, isSoundEnabled]);

  // Effect to manage the timer lifecycle
  useEffect(() => {
    if (isSubmitting) return; // Don't start a new timer while transitioning

    if (timerRef.current) clearInterval(timerRef.current);
    
    setTimeLeft(timePerQuestion);

    timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
            if (prevTime <= 1) {
                if (timerRef.current) clearInterval(timerRef.current);
                handleNextStep(undefined); // Time's up, answer is undefined
                return 0;
            }
            if (prevTime <= 6 && prevTime > 1) { // Tick for last 5 seconds
              playSound('tick', isSoundEnabled);
            }
            return prevTime - 1;
        });
    }, 1000);

    return () => { // Cleanup
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isSubmitting, handleNextStep, isSoundEnabled, timePerQuestion]);


  const handleOptionSelect = (option: string) => {
    if (isSubmitting) return;
    setSelectedOption(option);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption || isSubmitting) return;
    handleNextStep(selectedOption);
  };

  if (!currentQuestion) {
    return <div className="text-center p-8 text-slate-300">Loading question...</div>;
  }

  return (
    <div className="w-full max-w-2xl p-6 md:p-8 bg-slate-800 shadow-2xl rounded-xl">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
        {t('quizFlowTitle', { topic: quizTopic })}
      </h2>
      <Timer timeLeft={timeLeft} totalTime={timePerQuestion} />
      <ProgressBar current={currentIndex + 1} total={questions.length} />
      <QuestionDisplay
        question={currentQuestion}
        selectedOption={selectedOption}
        onOptionSelect={handleOptionSelect}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        showAnswer={isSubmitting}
      />
      <button
        onClick={handleSubmitAnswer}
        disabled={!selectedOption || isSubmitting}
        className="mt-6 md:mt-8 w-full px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-teal-500 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting 
          ? t('processingButton') 
          : (currentIndex < questions.length - 1 ? t('nextQuestionButton') : t('viewResultsButton'))}
      </button>
    </div>
  );
};

export default QuizFlow;
