
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QuizQuestion } from '../types';
import QuestionDisplay from './QuestionDisplay';
import ProgressBar from './ProgressBar';

interface QuizFlowProps {
  questions: QuizQuestion[];
  onQuizComplete: (finalScore: number, answeredQuestions: QuizQuestion[]) => void;
  quizTopic: string;
}

const QuizFlow: React.FC<QuizFlowProps> = ({ questions, onQuizComplete, quizTopic }) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentScore, setCurrentScore] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<string | undefined>(undefined);
  const [answeredQuestions, setAnsweredQuestions] = useState<QuizQuestion[]>(
    questions.map(q => ({ ...q, userAnswer: undefined }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = answeredQuestions[currentIndex];

  useEffect(() => {
    setSelectedOption(undefined);
  }, [currentIndex]);

  const handleOptionSelect = (option: string) => {
    setSelectedOption(option);
  };

  const handleSubmitAnswer = () => {
    if (!selectedOption) return;

    setIsSubmitting(true);

    const updatedQuestion = { ...currentQuestion, userAnswer: selectedOption };
    const newAnsweredQuestions = [...answeredQuestions];
    newAnsweredQuestions[currentIndex] = updatedQuestion;
    setAnsweredQuestions(newAnsweredQuestions);

    let newScore = currentScore;
    if (selectedOption === currentQuestion.correctAnswer) {
      newScore++;
      setCurrentScore(newScore);
    }
    
    setTimeout(() => {
      if (currentIndex < questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setSelectedOption(undefined);
      } else {
        onQuizComplete(newScore, newAnsweredQuestions);
      }
      setIsSubmitting(false);
    }, 300);
  };

  if (!currentQuestion) {
    return <div className="text-center p-8 text-slate-300">Loading question...</div>; // Consider translating
  }

  return (
    <div className="w-full max-w-2xl p-6 md:p-8 bg-slate-800 shadow-2xl rounded-xl">
      <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
        {t('quizFlowTitle', { topic: quizTopic })}
      </h2>
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
