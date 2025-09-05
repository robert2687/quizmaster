
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../types';
import * as authService from '../services/authService';
import Button from './Button';
import Avatar, { AVATAR_OPTIONS } from './Avatar';
import { OCCUPATIONS } from '../services/occupations';

interface ProfileEditorProps {
  currentUser: User;
  onProfileUpdate: (updatedUser: User) => void;
  onCancel: () => void;
}

const BIO_MAX_LENGTH = 150;

const ProfileEditor: React.FC<ProfileEditorProps> = ({ currentUser, onProfileUpdate, onCancel }) => {
  const { t } = useTranslation();
  const [playerName, setPlayerName] = useState(currentUser.playerName);
  const [bio, setBio] = useState(currentUser.bio);
  const [selectedAvatar, setSelectedAvatar] = useState(currentUser.avatar);
  const [occupation, setOccupation] = useState(currentUser.occupation || 'None');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await authService.updateUserProfile(currentUser.email, {
        playerName: playerName.trim(),
        avatar: selectedAvatar,
        bio: bio.trim(),
        occupation: occupation,
      });
      onProfileUpdate(updatedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
      setIsLoading(false);
    }
  };
  
  const commonInputClasses = "w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors";

  return (
    <div className="w-full max-w-lg p-6 md:p-8 bg-slate-800 shadow-2xl rounded-xl">
      <h2 className="text-2xl font-bold text-slate-100 mb-6 text-center">{t('profileEditorTitle')}</h2>
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">{t('avatarLabel')}</label>
          <div className="grid grid-cols-6 gap-2">
            {AVATAR_OPTIONS.map(avatarId => (
              <button
                key={avatarId}
                type="button"
                onClick={() => setSelectedAvatar(avatarId)}
                className={`p-1 rounded-full transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                  selectedAvatar === avatarId ? 'ring-2 ring-purple-500' : 'ring-2 ring-transparent'
                }`}
                aria-label={`Select avatar ${avatarId}`}
                aria-pressed={selectedAvatar === avatarId}
              >
                <Avatar avatarId={avatarId} className="w-12 h-12" />
              </button>
            ))}
          </div>
        </div>
        
        <div>
          <label htmlFor="playerName" className="block text-sm font-medium text-slate-300 mb-1">
            {t('playerNameLabel')}
          </label>
          <input
            type="text"
            id="playerName"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className={commonInputClasses}
            required
            maxLength={20}
          />
        </div>

        <div>
           <label htmlFor="occupation" className="block text-sm font-medium text-slate-300 mb-1">
            {t('occupationLabel')}
          </label>
          <select
            id="occupation"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            className={commonInputClasses}
          >
            {OCCUPATIONS.map(occ => (
              <option key={occ} value={occ}>{occ}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium text-slate-300 mb-1">
            {t('bioLabel')}
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={`${commonInputClasses} resize-none`}
            rows={3}
            maxLength={BIO_MAX_LENGTH}
            placeholder={t('bioPlaceholder')}
          />
          <p className="text-right text-xs text-slate-400 mt-1">
            {bio.length}/{BIO_MAX_LENGTH}
          </p>
        </div>
        
        {error && <p className="text-sm text-red-400 text-center">{error}</p>}

        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Button
            type="button"
            onClick={onCancel}
            variant="secondary"
            className="!bg-slate-600 hover:!bg-slate-500 !from-slate-600 !to-slate-600 focus:!ring-slate-400 w-full sm:w-1/2 order-2 sm:order-1"
          >
            {t('cancelButton')}
          </Button>
          <Button
            type="submit"
            disabled={isLoading || !playerName.trim()}
            className="w-full sm:w-1/2 order-1 sm:order-2"
          >
            {isLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              t('saveProfileButton')
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEditor;
