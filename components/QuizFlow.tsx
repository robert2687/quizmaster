import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { QuizQuestion, Difficulty } from '../types';
import QuestionDisplay from './QuestionDisplay';
import ProgressBar from './ProgressBar';
import Timer from './Timer';
import Button from './Button';
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
  
  // Refs to hold the latest state values to avoid recreating handleNextStep on every tick.
  const timeLeftRef = useRef(timeLeft);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  const totalPointsRef = useRef(totalPoints);
  useEffect(() => {
    totalPointsRef.current = totalPoints;
  }, [totalPoints]);


  const handleNextStep = useCallback((answer?: string) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsSubmitting(true);

    const isCorrect = answer === currentQuestion.correctAnswer;
    
    playSound(isCorrect ? 'correct' : 'incorrect', isSoundEnabled);

    const pointsThisTurn = isCorrect
      ? (difficulty === Difficulty.EASY ? 10 : difficulty === Difficulty.MEDIUM ? 20 : 30) + timeLeftRef.current
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
            // The score for this turn has been queued for update.
            // We use the ref for the score from previous questions and add the current turn's points
            // to ensure the final score passed to the parent is correct.
            const finalScore = totalPointsRef.current + pointsThisTurn;
            onQuizComplete(finalScore, newAnsweredQuestions);
        }
    }, 1200);
  }, [answeredQuestions, currentIndex, currentQuestion, difficulty, isSoundEnabled, onQuizComplete, questions.length]);

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
      <Button
        onClick={handleSubmitAnswer}
        disabled={!selectedOption || isSubmitting}
        variant="secondary"
        className="mt-6 md:mt-8 w-full"
      >
        {isSubmitting 
          ? t('processingButton') 
          : (currentIndex < questions.length - 1 ? t('nextQuestionButton') : t('viewResultsButton'))}
      </Button>
    </div>
  );
};

export default QuizFlow;