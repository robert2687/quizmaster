import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as authService from '../services/authService';
import { User } from '../types';
import Button from './Button';
import SparklesIcon from './icons/SparklesIcon';
import LinkButton from './LinkButton';
import EnvelopeIcon from './icons/EnvelopeIcon';

interface AuthFlowProps {
  onAuthSuccess: (user: User) => void;
}

type AuthMode = 'login' | 'signup' | 'verify' | 'forgot_password' | 'reset_link_sent';

const AuthFlow: React.FC<AuthFlowProps> = ({ onAuthSuccess }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AuthMode>('login');
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
      if (mode === 'login') {
        const user = await authService.login(email, password);
        onAuthSuccess(user);
      } else if (mode === 'signup') {
        await authService.signUp(playerName, email, password);
        setMode('verify');
      } else if (mode === 'forgot_password') {
        await authService.sendPasswordResetEmail(email);
        setMode('reset_link_sent');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(mode === 'login' ? t('authError') : t('signupError'));
      } else {
        setError('An unknown error occurred.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const commonInputClasses = "w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors";

  if (mode === 'verify') {
    return (
      <div className="w-full max-w-sm p-6 md:p-8 bg-slate-800 shadow-2xl rounded-xl text-center">
        <EnvelopeIcon className="w-12 h-12 mx-auto text-green-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-100 mb-3">
          {t('verifyEmailTitle')}
        </h2>
        <p className="text-slate-300 mb-6">
          {t('verifyEmailMessage', { email })}
        </p>
        <LinkButton onClick={() => setMode('login')}>
          {t('backToLoginButton')}
        </LinkButton>
      </div>
    );
  }

  if (mode === 'reset_link_sent') {
    return (
      <div className="w-full max-w-sm p-6 md:p-8 bg-slate-800 shadow-2xl rounded-xl text-center">
        <EnvelopeIcon className="w-12 h-12 mx-auto text-green-400 mb-4" />
        <h2 className="text-2xl font-bold text-slate-100 mb-3">
          {t('resetLinkSentTitle')}
        </h2>
        <p className="text-slate-300 mb-6">
          {t('resetLinkSentMessage', { email })}
        </p>
        <LinkButton onClick={() => setMode('login')}>
          {t('backToLoginButton')}
        </LinkButton>
      </div>
    );
  }
  
  if (mode === 'forgot_password') {
    return (
        <div className="w-full max-w-sm p-6 md:p-8 bg-slate-800 shadow-2xl rounded-xl">
        <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-100">
            {t('forgotPasswordTitle')}
            </h2>
            <p className="text-slate-400 mt-2">{t('forgotPasswordInstructions')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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

            {error && <p className="text-sm text-red-400 text-center">{error}</p>}

            <Button
            type="submit"
            disabled={isLoading || !email}
            className="w-full !mt-6"
            >
            {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            ) : (
                t('sendResetLinkButton')
            )}
            </Button>
        </form>
        <div className="mt-4 text-center">
            <LinkButton onClick={() => { setMode('login'); setError(null); }}>
            {t('backToLoginButton')}
            </LinkButton>
        </div>
        </div>
    );
  }

  return (
    <div className="w-full max-w-sm p-6 md:p-8 bg-slate-800 shadow-2xl rounded-xl">
      <div className="text-center mb-6">
        <SparklesIcon className="w-10 h-10 mx-auto text-pink-500 mb-2" />
        <h2 className="text-2xl font-bold text-slate-100">
          {mode === 'login' ? t('loginTitle') : t('signupTitle')}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === 'signup' && (
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
           {mode === 'login' && (
             <div className="flex items-center justify-between text-sm">
                <label htmlFor="password"className="block font-medium text-slate-300">
                    {t('passwordLabel')}
                </label>
                <LinkButton type="button" onClick={() => { setMode('forgot_password'); setError(null); }} className="text-xs">
                    {t('forgotPasswordLink')}
                </LinkButton>
            </div>
           )}
           {mode === 'signup' && (
             <label htmlFor="password"className="block text-sm font-medium text-slate-300 mb-1">
                {t('passwordLabel')}
            </label>
           )}
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${commonInputClasses} ${mode === 'login' ? 'mt-1' : ''}`}
            required
            autoComplete={mode === 'login' ? "current-password" : "new-password"}
          />
        </div>

        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

        <Button
          type="submit"
          disabled={isLoading || !email || !password || (mode === 'signup' && !playerName)}
          className="w-full !mt-6"
        >
          {isLoading ? (
             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
          ) : (
            mode === 'login' ? t('loginButton') : t('signupButton')
          )}
        </Button>
      </form>
      <div className="mt-4 text-center">
        <LinkButton onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(null); }}>
          {mode === 'login' ? t('switchToSignup') : t('switchToLogin')}
        </LinkButton>
      </div>
    </div>
  );
};

export default AuthFlow;