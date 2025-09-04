import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SparklesIcon from './icons/SparklesIcon';
import { Difficulty } from '../types';
import Button from './Button';

interface TopicFormProps {
  onGenerateQuiz: (topic: string, difficulty: Difficulty) => void;
  isGenerating: boolean;
}

const TopicForm: React.FC<TopicFormProps> = ({ onGenerateQuiz, isGenerating }) => {
  const { t } = useTranslation();
  const [topic, setTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isGenerating) {
      onGenerateQuiz(topic.trim(), difficulty);
    }
  };

  const difficultyOptions = [
    { id: Difficulty.EASY, label: t('difficultyEasy') },
    { id: Difficulty.MEDIUM, label: t('difficultyMedium') },
    { id: Difficulty.HARD, label: t('difficultyHard') },
  ];

  return (
    <div className="w-full max-w-lg p-6 md:p-8 bg-slate-800 shadow-2xl rounded-xl">
      <h2 className="text-2xl font-semibold text-slate-100 mb-6 text-center">{t('topicFormTitle')}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-slate-300 mb-1">
            {t('topicFormLabel')}
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={t('topicFormPlaceholder')}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
            disabled={isGenerating}
            aria-label={t('topicFormLabel')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            {t('difficultyLabel')}
          </label>
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-700 p-1">
            {difficultyOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setDifficulty(option.id)}
                className={`w-full px-2 py-2 text-sm font-semibold rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800
                  ${difficulty === option.id
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }
                `}
                aria-pressed={difficulty === option.id}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          disabled={isGenerating || !topic.trim()}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('generatingButton')}
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5 mr-2" />
              {t('generateQuizButton')}
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default TopicForm;
