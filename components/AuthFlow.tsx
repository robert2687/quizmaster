import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as authService from '../services/authService';
import { User } from '../types';
import Button from './Button';
import SparklesIcon from './icons/SparklesIcon';
import LinkButton from './LinkButton';

interface AuthFlowProps {
  onAuthSuccess: (user: User) => void;
}

const AuthFlow: React.FC<AuthFlowProps> = ({ onAuthSuccess }) => {
  const { t } = useTranslation();
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let user: User;
      if (isLoginView) {
        user = await authService.login(email, password);
      } else {
        user = await authService.signUp(playerName, email, password);
      }
      onAuthSuccess(user);
    } catch (err) {
      if (err instanceof Error) {
        setError(isLoginView ? t('authError') : t('signupError'));
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const commonInputClasses = "w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors";

  return (
    <div className="w-full max-w-sm p-6 md:p-8 bg-slate-800 shadow-2xl rounded-xl">
      <div className="text-center mb-6">
        <SparklesIcon className="w-10 h-10 mx-auto text-pink-500 mb-2" />
        <h2 className="text-2xl font-bold text-slate-100">
          {isLoginView ? t('loginTitle') : t('signupTitle')}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLoginView && (
          <div>
            <label htmlFor="playerName" className="block text-sm font-medium text-slate-300 mb-1">
              {t('playerNameLabel')}
            </label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder={t('playerNamePlaceholder')}
              className={commonInputClasses}
              required
              maxLength={20}
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
            {t('emailLabel')}
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={commonInputClasses}
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="password"className="block text-sm font-medium text-slate-300 mb-1">
            {t('passwordLabel')}
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={commonInputClasses}
            required
            autoComplete={isLoginView ? "current-password" : "new-password"}
          />
        </div>

        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

        <Button
          type="submit"
          disabled={isLoading || !email || !password || (!isLoginView && !playerName)}
          className="w-full !mt-6"
        >
          {isLoading ? (
             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
          ) : (
            isLoginView ? t('loginButton') : t('signupButton')
          )}
        </Button>
      </form>
      <div className="mt-4 text-center">
        <LinkButton onClick={() => { setIsLoginView(!isLoginView); setError(null); }}>
          {isLoginView ? t('switchToSignup') : t('switchToLogin')}
        </LinkButton>
      </div>
    </div>
  );
};

export default AuthFlow;
