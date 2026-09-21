// Compatibility exports. Feature code imports its service module directly.
export {
  loginWithGoogle,
  register,
  login,
  logout,
  refresh,
  getMe,
  verifyEmail,
  resendEmail,
  forgotPassword,
  resendEmailForgot,
  verifyEmailForgot,
} from "../services/auth";
export {
  startAttempt,
  autoSaveAttempt,
  submitAttempt,
  getAttemptResult,
  type NavigatorEntry,
  type NavigatorResponse,
  getQuestionNavigator,
  toggleQuestionFlag,
  getAttempt,
  getPlacementStatus,
} from "../services/attempts";
export {
  getPublicExams,
  getQuestionTypes,
  getQuestionsByType,
  getExamsByQuestionType,
} from "../services/exams";
export {
  type ProgressRingResponse,
  getProgressRing,
  getGamificationStats,
  getAchievements,
  getLeaderboard,
  getXpHistory,
  dailyCheckin,
} from "../services/gamification";
export {
  createDeck,
  createDeckCard,
  createBulkCards,
  updateDeck,
  updateCard,
  deleteCard,
  getOwnDecks,
  getDeckCards,
  getDueFlashcards,
  reviewFlashcard,
  getFlashcardProgress,
  getPublicHandler,
  subscribeDeck,
  getUserSubscriptions,
  unsubscribeDeck,
  enrichVocabulary,
  extractVocabulary,
} from "../services/vocabulary";
export {
  audioSubmitFromUrl,
  getSpeakingExams,
  startSpeakingExam,
  getSpeakingExamsById,
  gradeSpeaking,
  uploadFile,
  getSpeakingHistory,
  getSpeakingHistoryById,
} from "../services/speaking";
export {
  createExam,
  gradeWriting,
  getWritingExams,
  getWritingExamById,
  startWritingExam,
  getWritingHistory,
  getWritingHistoryById,
} from "../services/writing";
export { suggestDictionary, getDictionaryDetails, lookupDictionary } from "../services/dictionary";
export {
  getAnalyticsSummary,
  getScoreTrend,
  getStrengthsWeaknesses,
  getRecentAnalyticsActivity,
  getWrongAnswers,
  getPredictedBand,
  getAiInsights,
  getRecommendations,
} from "../services/analytics";
export {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getNotificationSettings,
  updateNotificationSettings,
} from "../services/notifications";
export {
  createStudyGoal,
  getActiveStudyGoal,
  getStudyProgress,
  deleteStudyGoal,
} from "../services/studyPlan";
export {
  getCourses,
  getCourseBySlug,
  getLessonsBySlug,
  getLessonById,
  completeLesson,
} from "../services/courses";
export { createBookmark, getBookmarks, deleteBookmark, checkBookmark } from "../services/bookmarks";
export { createNote, getNotes, updateNote, deleteNote } from "../services/notes";
export {
  type RoleplayScenario,
  type RoleplayTurnMessage,
  type RoleplayStartPayload,
  type RoleplayStartResponse,
  type RoleplayTurnPayload,
  type RoleplayTurnResponse,
  getRoleplayScenarios,
  startRoleplaySession,
  sendRoleplayTurn,
  type RoleplayFeedback,
  type RoleplayTurnWithSpeechPayload,
  type RoleplayTurnWithSpeechResponse,
  sendRoleplayTurnWithSpeech,
  sendRoleplayTurnAudio,
} from "../services/roleplay";
