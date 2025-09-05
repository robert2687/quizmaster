import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SparklesIcon from './icons/SparklesIcon';
import { Difficulty } from '../types';
import Button from './Button';
import { getTopicSuggestions } from '../services/topicSuggestions';

interface TopicFormProps {
  onGenerateQuiz: (topic: string, difficulty: Difficulty, useGrounding: boolean) => void;
  isGenerating: boolean;
}

const TopicForm: React.FC<TopicFormProps> = ({ onGenerateQuiz, isGenerating }) => {
  const { t } = useTranslation();
  const [topic, setTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [useGrounding, setUseGrounding] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isGenerating) {
      onGenerateQuiz(topic.trim(), difficulty, useGrounding);
      setSuggestions([]);
    }
  };

  const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setTopic(query);
    if (query.trim().length > 0) {
      const filteredSuggestions = getTopicSuggestions(query);
      setSuggestions(filteredSuggestions);
      setActiveSuggestionIndex(0); // Reset to top of the list
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setTopic(suggestion);
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        break;
      case 'Enter':
        e.preventDefault();
        handleSuggestionClick(suggestions[activeSuggestionIndex]);
        break;
      case 'Escape':
        setSuggestions([]);
        break;
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
        <div className="relative">
          <label htmlFor="topic" className="block text-sm font-medium text-slate-300 mb-1">
            {t('topicFormLabel')}
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={handleTopicChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setSuggestions([]), 150)} // Delay to allow click
            placeholder={t('topicFormPlaceholder')}
            className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors"
            disabled={isGenerating}
            aria-label={t('topicFormLabel')}
            autoComplete="off"
          />
          {suggestions.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg overflow-hidden">
              {suggestions.map((suggestion, index) => (
                <li
                  key={suggestion}
                  className={`px-4 py-2 cursor-pointer transition-colors ${
                    index === activeSuggestionIndex ? 'bg-purple-600 text-white' : 'hover:bg-slate-600 text-slate-200'
                  }`}
                  onMouseDown={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
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

        <div className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
          <div className="pr-4">
            <label htmlFor="grounding-toggle" className="text-sm font-medium text-slate-200 cursor-pointer">
              {t('useGroundingLabel')}
            </label>
            <p className="text-xs text-slate-400">{t('useGroundingTooltip')}</p>
          </div>
          <button
            type="button"
            id="grounding-toggle"
            onClick={() => setUseGrounding(!useGrounding)}
            className={`${
              useGrounding ? 'bg-purple-600' : 'bg-slate-600'
            } relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800`}
            role="switch"
            aria-checked={useGrounding}
          >
            <span
              aria-hidden="true"
              className={`${
                useGrounding ? 'translate-x-5' : 'translate-x-0'
              } pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`}
            />
          </button>
        </div>

        <Button
          type="submit"
          disabled={isGenerating || !topic.trim()}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="http://www.w3.org/2000/svg">
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