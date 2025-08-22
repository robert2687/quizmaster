import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QuizQuestion } from '../types';
import RetryIcon from './icons/RetryIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import XCircleIcon from './icons/XCircleIcon';

interface ResultsDisplayProps {
  score: number;
  questions: QuizQuestion[];
  onRestart: () => void;
  quizTopic: string;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ score, questions, onRestart, quizTopic }) => {
  const { t, i18n } = useTranslation();
  const totalQuestions = questions.length;
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

  let feedbackMessageKey = "";
  let feedbackColor = "text-green-400";

  if (percentage >= 80) {
    feedbackMessageKey = "feedbackExcellent";
    feedbackColor = "text-green-400";
  } else if (percentage >= 60) {
    feedbackMessageKey = "feedbackGreat";
    feedbackColor = "text-yellow-400";
  } else if (percentage >= 40) {
    feedbackMessageKey = "feedbackGood";
    feedbackColor = "text-orange-400";
  } else {
    feedbackMessageKey = "feedbackKeepTrying";
    feedbackColor = "text-red-400";
  }

  const handleShareResults = async () => {
    const shareText = t('shareResultsText', {
      score,
      totalQuestions,
      percentage,
      topic: quizTopic,
      interpolation: { escapeValue: false } // Allow for dynamic topic name
    });

    try {
      await navigator.clipboard.writeText(shareText);
      setShareStatus('copied');
      setTimeout(() => setShareStatus('idle'), 2000); // Reset after 2 seconds
    } catch (err) {
      console.error('Failed to copy results: ', err);
      // Optionally, show an error message to the user
    }
  };

  return (
    <div className="w-full max-w-2xl p-6 md:p-8 bg-slate-800 shadow-2xl rounded-xl">
      <h2 className="text-3xl md:text-4xl font-extrabold text-center mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
        {t('resultsTitle')}
      </h2>
      <p className="text-center text-slate-400 mb-6 text-lg">{t('resultsTopicLabel', { topic: quizTopic })}</p>
      
      <div className="text-center mb-8 p-6 bg-slate-700 rounded-lg">
        <p className={`text-5xl font-bold ${feedbackColor}`}>{t('scorePercentage', {percentage})}</p>
        <p className="text-2xl text-slate-200 mt-1">
          {t('scoreOutOf', { score, totalQuestions })}
        </p>
        <p className={`mt-3 text-lg font-semibold ${feedbackColor}`}>{t(feedbackMessageKey)}</p>
      </div>

      <div className="mb-8">
        <h3 className="text-xl font-semibold text-slate-100 mb-4">{t('reviewAnswersTitle')}</h3>
        <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
          {questions.map((q, index) => (
            <div key={q.id} className="p-4 bg-slate-700 rounded-lg shadow">
              <p className="font-semibold text-slate-200 mb-1">
                {index + 1}. {q.question}
              </p>
              <p className={`text-sm ${q.userAnswer === q.correctAnswer ? 'text-green-400' : 'text-red-400'}`}>
                {t('yourAnswerLabel', { answer: q.userAnswer || t('notAnswered') })}
                {q.userAnswer === q.correctAnswer ? 
                  <CheckCircleIcon className="inline w-4 h-4 ml-1" /> : 
                  <XCircleIcon className="inline w-4 h-4 ml-1" />
                }
              </p>
              {q.userAnswer !== q.correctAnswer && (
                <p className="text-sm text-sky-400">{t('correctAnswerLabel', { answer: q.correctAnswer })}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
        <button
          onClick={onRestart}
          className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-pink-500 transition-colors duration-150 ease-in-out"
        >
          <RetryIcon className="w-5 h-5 mr-2" />
          {t('createNewQuizButton')}
        </button>
        <button
          onClick={handleShareResults}
          disabled={shareStatus === 'copied'}
          className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 transition-all duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {shareStatus === 'copied' ? (
            <>
              <CheckCircleIcon className="w-5 h-5 mr-2" />
              {t('copiedButton')}
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
              </svg>
              {t('shareScoreButton')}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ResultsDisplay;