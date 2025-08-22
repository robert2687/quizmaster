
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import SparklesIcon from './icons/SparklesIcon';

interface TopicFormProps {
  onGenerateQuiz: (topic: string) => void;
  isGenerating: boolean;
}

const TopicForm: React.FC<TopicFormProps> = ({ onGenerateQuiz, isGenerating }) => {
  const { t } = useTranslation();
  const [topic, setTopic] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && !isGenerating) {
      onGenerateQuiz(topic.trim());
    }
  };

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
        <button
          type="submit"
          disabled={isGenerating || !topic.trim()}
          className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-pink-500 transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
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
        </button>
      </form>
    </div>
  );
};

export default TopicForm;
