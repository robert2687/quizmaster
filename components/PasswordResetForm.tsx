import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as authService from '../services/authService';
import Button from './Button';

interface PasswordResetFormProps {
  onPasswordUpdated: () => void;
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ onPasswordUpdated }) => {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError(t('passwordLengthError'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatchError'));
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await authService.updateUserPassword(password);
      onPasswordUpdated();
      // Log the user out to force them to re-authenticate with the new password.
      // This will trigger the onAuthStateChange listener in App.tsx to transition to the login screen.
      await authService.logout();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password.');
      setIsLoading(false);
    }
  };
  
  const commonInputClasses = "w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors";

  return (
    <div className="w-full max-w-sm p-6 md:p-8 bg-slate-800 shadow-2xl rounded-xl">
      <h2 className="text-2xl font-bold text-slate-100 mb-6 text-center">{t('updatePasswordTitle')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-slate-300 mb-1">
            {t('newPasswordLabel')}
          </label>
          <input
            type="password"
            id="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={commonInputClasses}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>
        <div>
          <label htmlFor="confirm-password"className="block text-sm font-medium text-slate-300 mb-1">
            {t('confirmPasswordLabel')}
          </label>
          <input
            type="password"
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={commonInputClasses}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

        <Button
          type="submit"
          disabled={isLoading || !password || password !== confirmPassword}
          className="w-full !mt-6"
        >
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
          ) : (
            t('updatePasswordButton')
          )}
        </Button>
      </form>
    </div>
  );
};

export default PasswordResetForm;