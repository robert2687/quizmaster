import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { QuizQuestion } from '../types';
import QuestionDisplay from './QuestionDisplay';
import ProgressBar from './ProgressBar';
import Timer from './Timer'; // Import the new Timer component

interface QuizFlowProps {
  questions: QuizQuestion[];
  onQuizComplete: (finalScore: number, answeredQuestions: QuizQuestion[]) => void;
  quizTopic: string;
}

const TIME_PER_QUESTION = 20; // 20 seconds per question

const QuizFlow: React.FC<QuizFlowProps> = ({ questions, onQuizComplete, quizTopic }) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(undefined);
  const [answeredQuestions, setAnsweredQuestions] = useState<QuizQuestion[]>(
    questions.map(q => ({ ...q, userAnswer: undefined }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  // FIX: Use ReturnType<typeof setTimeout> for timer ref to be environment-agnostic (browser/Node.js).
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQuestion = answeredQuestions[currentIndex];

  const handleNextStep = useCallback((answer?: string) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsSubmitting(true);

    const isCorrect = answer === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      setCurrentScore(prev => prev + 1);
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
            const finalScore = isCorrect ? currentScore + 1 : currentScore;
            onQuizComplete(finalScore, newAnsweredQuestions);
        }
    }, 300); // Small delay for user feedback on the choice
  }, [answeredQuestions, currentIndex, currentQuestion, currentScore, onQuizComplete, questions.length]);

  // Effect to manage the timer lifecycle
  useEffect(() => {
    if (isSubmitting) return; // Don't start a new timer while transitioning

    if (timerRef.current) clearInterval(timerRef.current);
    
    setTimeLeft(TIME_PER_QUESTION);

    timerRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
            if (prevTime <= 1) {
                if (timerRef.current) clearInterval(timerRef.current);
                handleNextStep(undefined); // Time's up, answer is undefined
                return 0;
            }
            return prevTime - 1;
        });
    }, 1000);

    return () => { // Cleanup
        if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isSubmitting, handleNextStep]);


  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption) return;
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
      <Timer timeLeft={timeLeft} totalTime={TIME_PER_QUESTION} />
      <ProgressBar current={currentIndex + 1} total={questions.length} />
      <QuestionDisplay
        question={currentQuestion}
        selectedOption={selectedOption}
        onOptionSelect={handleOptionSelect}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        isSubmitting={isSubmitting}
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
