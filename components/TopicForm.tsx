import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import SparklesIcon from './icons/SparklesIcon';
import ImageIcon from './icons/ImageIcon';
import { Difficulty, ImagePayload } from '../types';
import Button from './Button';
import { getTopicSuggestions } from '../services/topicSuggestions';

interface TopicFormProps {
  onGenerateQuiz: (topic: string, difficulty: Difficulty, useGrounding: boolean, imagePayload: ImagePayload | null) => void;
  isGenerating: boolean;
}

const MAX_FILE_SIZE_MB = 4;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const TopicForm: React.FC<TopicFormProps> = ({ onGenerateQuiz, isGenerating }) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<'text' | 'image'>('text');
  
  // Text mode state
  const [topic, setTopic] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState<number>(0);

  // Image mode state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePayload, setImagePayload] = useState<ImagePayload | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageContextPrompt, setImageContextPrompt] = useState('');

  // Common state
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [useGrounding, setUseGrounding] = useState<boolean>(false);
  
  const resetImageState = () => {
    setImageFile(null);
    setImagePreview(null);
    setImagePayload(null);
    setImageError(null);
  };

  const handleFileChange = (file: File | null) => {
    resetImageState();
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setImageError(t('errorInvalidImageType'));
      return;
    }
    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setImageError(t('errorImageTooLarge', { size: MAX_FILE_SIZE_MB }));
      return;
    }
    
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setImagePayload({ mimeType: file.type, data: base64String });
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const onDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };
  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    handleFileChange(file || null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isGenerating) return;

    if (mode === 'text' && topic.trim()) {
      onGenerateQuiz(topic.trim(), difficulty, useGrounding, null);
      setSuggestions([]);
    } else if (mode === 'image' && imagePayload) {
      onGenerateQuiz(imageContextPrompt.trim(), difficulty, false, imagePayload);
    }
  };

  const handleTopicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setTopic(query);
    if (query.trim().length > 0) {
      const filteredSuggestions = getTopicSuggestions(query);
      setSuggestions(filteredSuggestions);
      setActiveSuggestionIndex(0);
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
      case 'ArrowDown': e.preventDefault(); setActiveSuggestionIndex(p => (p + 1) % suggestions.length); break;
      case 'ArrowUp': e.preventDefault(); setActiveSuggestionIndex(p => (p - 1 + suggestions.length) % suggestions.length); break;
      case 'Enter': e.preventDefault(); handleSuggestionClick(suggestions[activeSuggestionIndex]); break;
      case 'Escape': setSuggestions([]); break;
    }
  };

  const difficultyOptions = [
    { id: Difficulty.EASY, label: t('difficultyEasy') },
    { id: Difficulty.MEDIUM, label: t('difficultyMedium') },
    { id: Difficulty.HARD, label: t('difficultyHard') },
  ];

  const renderTextMode = () => (
    <div className="space-y-6">
      <div className="relative">
        <label htmlFor="topic" className="block text-sm font-medium text-slate-300 mb-1">{t('topicFormLabel')}</label>
        <input type="text" id="topic" value={topic} onChange={handleTopicChange} onKeyDown={handleKeyDown} onBlur={() => setTimeout(() => setSuggestions([]), 150)} placeholder={t('topicFormPlaceholder')} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors" disabled={isGenerating} aria-label={t('topicFormLabel')} autoComplete="off" />
        {suggestions.length > 0 && (
          <ul className="absolute z-10 w-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-lg overflow-hidden">
            {suggestions.map((suggestion, index) => (
              <li key={suggestion} className={`px-4 py-2 cursor-pointer transition-colors ${index === activeSuggestionIndex ? 'bg-purple-600 text-white' : 'hover:bg-slate-600 text-slate-200'}`} onMouseDown={() => handleSuggestionClick(suggestion)}>{suggestion}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex items-center justify-between bg-slate-700/50 p-3 rounded-lg">
        <div className="pr-4">
          <label htmlFor="grounding-toggle" className="text-sm font-medium text-slate-200 cursor-pointer">{t('useGroundingLabel')}</label>
          <p className="text-xs text-slate-400">{t('useGroundingTooltip')}</p>
        </div>
        <button type="button" id="grounding-toggle" onClick={() => setUseGrounding(!useGrounding)} className={`${useGrounding ? 'bg-purple-600' : 'bg-slate-600'} relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800`} role="switch" aria-checked={useGrounding}>
          <span aria-hidden="true" className={`${useGrounding ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out`} />
        </button>
      </div>
    </div>
  );

  const renderImageMode = () => (
    <div className="space-y-4">
      {!imagePreview ? (
        <div>
          <label htmlFor="image-upload" className="relative block w-full p-8 border-2 border-dashed border-slate-600 rounded-lg text-center cursor-pointer hover:border-purple-500 transition-colors" onDragOver={onDragOver} onDrop={onDrop}>
            <ImageIcon className="w-12 h-12 mx-auto text-slate-500" />
            <span className="mt-2 block text-sm font-semibold text-slate-300">{t('dropImageHere')}</span>
            <input id="image-upload" type="file" className="sr-only" onChange={e => handleFileChange(e.target.files?.[0] || null)} accept={ACCEPTED_IMAGE_TYPES.join(',')} />
          </label>
          {imageError && <p className="text-sm text-red-400 mt-2 text-center">{imageError}</p>}
        </div>
      ) : (
        <div className="text-center">
          <img src={imagePreview} alt="Quiz preview" className="max-h-48 w-auto mx-auto rounded-lg shadow-lg" />
           <Button type="button" onClick={() => handleFileChange(null)} className="mt-4 !py-1 !px-3 !text-sm !bg-slate-600 hover:!bg-slate-500 !from-slate-600 !to-slate-600 focus:!ring-slate-400">{t('changeImageButton')}</Button>
        </div>
      )}
      <div>
        <label htmlFor="imageContext" className="block text-sm font-medium text-slate-300 mb-1">{t('imageContextPromptLabel')}</label>
        <input type="text" id="imageContext" value={imageContextPrompt} onChange={e => setImageContextPrompt(e.target.value)} placeholder={t('imageContextPromptPlaceholder')} className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-slate-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-colors" disabled={isGenerating} />
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-lg p-6 md:p-8 bg-slate-800 shadow-2xl rounded-xl">
      <div className="mb-6">
        <div className="flex border-b border-slate-700">
          <button onClick={() => setMode('text')} className={`py-2 px-4 font-semibold transition-colors ${mode === 'text' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}>{t('textPromptTab')}</button>
          <button onClick={() => setMode('image')} className={`py-2 px-4 font-semibold transition-colors ${mode === 'image' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}>{t('imagePromptTab')}</button>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {mode === 'text' ? renderTextMode() : renderImageMode()}
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">{t('difficultyLabel')}</label>
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-slate-700 p-1">
            {difficultyOptions.map(option => (
              <button key={option.id} type="button" onClick={() => setDifficulty(option.id)} className={`w-full px-2 py-2 text-sm font-semibold rounded-md transition-colors duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-800 ${difficulty === option.id ? 'bg-purple-600 text-white shadow' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`} aria-pressed={difficulty === option.id}>
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        <Button type="submit" disabled={isGenerating || (mode === 'text' && !topic.trim()) || (mode === 'image' && !imagePayload)} className="w-full">
          {isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              {mode === 'image' ? t('generatingFromImage') : t('generatingButton')}
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
