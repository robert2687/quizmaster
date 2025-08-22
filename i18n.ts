import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Jazykové zdroje – každý jazyk má svoje kľúče a preklady.
const resources = {
  en: {
    translation: {
      // App
      appName: "QuizMaster AI",
      footerRights: "QuizMaster AI",
      poweredBy: "Powered by Gemini AI.",
      // Header
      headerSubtitle: "Generate engaging quizzes on any topic in seconds!",
      // TopicForm
      topicFormTitle: "Enter a topic to start your quiz:", 
      topicFormLabel: "Enter a topic (e.g., \"Roman History\", \"Quantum Physics Basics\")",
      topicFormPlaceholder: "e.g., The Solar System",
      generateQuizButton: "Generate Quiz",
      generatingButton: "Generating...",
      // LoadingSpinner
      loadingMessageDefault: "Generating your quiz...",
      loadingMessageTopic: "Generating your quiz on \"{{topic}}\"...",
      pleaseWait: "Please wait a moment.",
      // ErrorDisplay
      errorTitle: "Oops! Something went wrong.",
      tryAgainButton: "Try Again",
      // QuizFlow
      quizFlowTitle: "{{topic}} Quiz",
      nextQuestionButton: "Next Question",
      viewResultsButton: "View Results",
      processingButton: "Processing...",
      // ResultsDisplay
      resultsTitle: "Quiz Results",
      resultsTopicLabel: "Topic: {{topic}}",
      scorePercentage: "{{percentage}}%",
      scoreOutOf: "You scored {{score}} out of {{totalQuestions}}",
      reviewAnswersTitle: "Review Your Answers:",
      yourAnswerLabel: "Your answer: {{answer}}",
      notAnswered: "Not answered",
      correctAnswerLabel: "Correct answer: {{answer}}",
      createNewQuizButton: "Create New Quiz",
      feedbackExcellent: "Excellent work! You're a QuizMaster!",
      feedbackGreat: "Great job! You know your stuff.",
      feedbackGood: "Good effort! Keep learning.",
      feedbackKeepTrying: "Keep trying! Practice makes perfect.",
      shareScoreButton: "Share My Score",
      copiedButton: "Copied!",
      shareResultsText: "I scored {{score}}/{{totalQuestions}} ({{percentage}}%) on the \"{{topic}}\" quiz on QuizMaster AI! Beat my score!",
      // QuestionDisplay
      questionLabel: "Question {{current}} of {{total}}",
      // Language Switcher
      switchToEnglish: "English",
      switchToSlovak: "Slovenčina",
      // Leaderboard
      viewLeaderboardButton: "View Leaderboard",
      leaderboardTitle: "Local Leaderboard (Top 10)",
      leaderboardRank: "Rank",
      leaderboardTopic: "Topic",
      leaderboardScore: "Score",
      leaderboardDate: "Date",
      leaderboardNoScores: "No scores recorded yet. Play a quiz to see your name here!",
      backToQuizButton: "Back to Quiz",
      leaderboardPlayer: "Player", // Default player name
    },
  },
  sk: {
    translation: {
      // App
      appName: "QuizMaster AI",
      footerRights: "QuizMaster AI",
      poweredBy: "Vytvorené s Gemini AI.",
      // Header
      headerSubtitle: "Vytvárajte pútavé kvízy na akúkoľvek tému v priebehu sekúnd!",
      // TopicForm
      topicFormTitle: "Zadajte tému na spustenie kvízu:", 
      topicFormLabel: "Zadajte tému (napr. \"Rímska história\", \"Základy kvantovej fyziky\")",
      topicFormPlaceholder: "napr. Slnečná sústava",
      generateQuizButton: "Generovať kvíz",
      generatingButton: "Generujem...",
      // LoadingSpinner
      loadingMessageDefault: "Generujem váš kvíz...",
      loadingMessageTopic: "Generujem váš kvíz na tému \"{{topic}}\"...",
      pleaseWait: "Prosím čakajte chvíľu.",
      // ErrorDisplay
      errorTitle: "Ups! Niečo sa pokazilo.",
      tryAgainButton: "Skúsiť znova",
      // QuizFlow
      quizFlowTitle: "{{topic}} kvíz",
      nextQuestionButton: "Ďalšia otázka",
      viewResultsButton: "Zobraziť výsledky",
      processingButton: "Spracúvam...",
      // ResultsDisplay
      resultsTitle: "Výsledky kvízu",
      resultsTopicLabel: "Téma: {{topic}}",
      scorePercentage: "{{percentage}}%",
      scoreOutOf: "Získali ste {{score}} z {{totalQuestions}} bodov",
      reviewAnswersTitle: "Skontrolujte si odpovede:",
      yourAnswerLabel: "Vaša odpoveď: {{answer}}",
      notAnswered: "Nezodpovedané",
      correctAnswerLabel: "Správna odpoveď: {{answer}}",
      createNewQuizButton: "Vytvoriť nový kvíz",
      feedbackExcellent: "Výborná práca! Ste QuizMaster!",
      feedbackGreat: "Skvelá práca! Viete svoje.",
      feedbackGood: "Dobrý pokus! Pokračujte v učení.",
      feedbackKeepTrying: "Skúšajte ďalej! Prax robí majstra.",
      shareScoreButton: "Zdieľať moje skóre",
      copiedButton: "Skopírované!",
      shareResultsText: "Získal/a som {{score}}/{{totalQuestions}} ({{percentage}}%) v kvíze na tému \"{{topic}}\" v QuizMaster AI! Prekonaj ma!",
      // QuestionDisplay
      questionLabel: "Otázka {{current}} z {{total}}",
      // Language Switcher
      switchToEnglish: "Angličtina",
      switchToSlovak: "Slovenčina",
      // Leaderboard
      viewLeaderboardButton: "Zobraziť Rebríček",
      leaderboardTitle: "Miestny Rebríček (Top 10)",
      leaderboardRank: "Poradie",
      leaderboardTopic: "Téma",
      leaderboardScore: "Skóre",
      leaderboardDate: "Dátum",
      leaderboardNoScores: "Zatiaľ žiadne zaznamenané skóre. Zahrajte si kvíz a zapíšte sa!",
      backToQuizButton: "Späť na Kvíz",
      leaderboardPlayer: "Hráč",
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en", // Default language set to English
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already does escaping
  },
  debug: false, // Set to false for production, true for development
});

export default i18n;