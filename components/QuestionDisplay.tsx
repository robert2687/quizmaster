
import React from 'react';
import { useTranslation } from 'react-i18next';
import { QuizQuestion } from '../types';

interface QuestionDisplayProps {
  question: QuizQuestion;
  selectedOption: string | undefined;
  onOptionSelect: (option: string) => void;
  questionNumber: number;
  totalQuestions: number;
  showAnswer: boolean;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  selectedOption,
  onOptionSelect,
  questionNumber,
  totalQuestions,
  showAnswer,
}) => {
  const { t } = useTranslation();

  const getButtonClass = (option: string) => {
    const isSelected = selectedOption === option;
    const isCorrect = question.correctAnswer === option;

    // Base classes
    let classes = 'w-full text-left p-3 md:p-4 border-2 rounded-lg transition-all duration-150 ease-in-out';

    if (showAnswer) {
      if (isCorrect) {
        // Correct answer is always green and highlighted
        return `${classes} bg-green-600 border-green-500 text-white scale-105 shadow-lg`;
      }
      if (isSelected && !isCorrect) {
        // Incorrectly selected answer is red
        return `${classes} bg-red-600 border-red-500 text-white`;
      }
      // Other non-selected, incorrect options are faded
      return `${classes} bg-slate-700 border-slate-600 opacity-60 cursor-not-allowed`;
    }

    // Default state before answer is shown
    if (isSelected) {
      return `${classes} bg-purple-600 border-purple-500 text-white shadow-lg scale-105`;
    }
    return `${classes} bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-purple-500 text-slate-200`;
  };

  return (
    <div className="w-full">
      <div className="mb-4 md:mb-6">
        <p className="text-sm text-purple-400 font-semibold">
          {t('questionLabel', { current: questionNumber, total: totalQuestions })}
        </p>
        <h3 className="text-xl md:text-2xl font-semibold text-slate-100 mt-1 break-words">
          {question.question}
        </h3>
      </div>
      <div className="space-y-3 md:space-y-4">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onOptionSelect(option)}
            disabled={showAnswer}
            className={getButtonClass(option)}
            aria-pressed={selectedOption === option}
          >
            <span className="font-medium">{option}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuestionDisplay;
