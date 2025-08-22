
import React from 'react';
import { useTranslation } from 'react-i18next';
import { QuizQuestion } from '../types';

interface QuestionDisplayProps {
  question: QuizQuestion;
  selectedOption: string | undefined;
  onOptionSelect: (option: string) => void;
  questionNumber: number;
  totalQuestions: number;
  isSubmitting: boolean;
}

const QuestionDisplay: React.FC<QuestionDisplayProps> = ({
  question,
  selectedOption,
  onOptionSelect,
  questionNumber,
  totalQuestions,
  isSubmitting
}) => {
  const { t } = useTranslation();
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
            disabled={isSubmitting}
            className={`w-full text-left p-3 md:p-4 border-2 rounded-lg transition-all duration-150 ease-in-out
              ${selectedOption === option
                ? 'bg-purple-600 border-purple-500 text-white shadow-lg scale-105'
                : 'bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-purple-500 text-slate-200'
              }
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800
              disabled:opacity-70 disabled:cursor-wait
            `}
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
