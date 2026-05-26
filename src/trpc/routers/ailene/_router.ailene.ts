import { createTRPCRouter } from "@/trpc/init";
import { createAilene } from "./create.ailene";
import { listAilene } from "./list.ailene";
import { readAilene } from "./read.ailene";
import { updateAilene } from "./update.ailene";

export const aileneRouter = createTRPCRouter({
  list: createTRPCRouter({
    // any member (student / champion / sponsor)
    levels: listAilene.levels,
    chapters: listAilene.chapters,
    tasks: listAilene.tasks,
    quizQuestions: listAilene.quizQuestions,
    assignedPrompts: listAilene.myAssignedPrompts,
    assignedUseCases: listAilene.myAssignedUseCases,
    // champion only
    members: listAilene.championMembers,
    categories: listAilene.categories,
    promptLibrary: listAilene.promptLibrary,
    useCaseLibrary: listAilene.useCaseLibrary,
    promptSubmissions: listAilene.championPromptSubmissions,
    useCaseSubmissions: listAilene.championUseCaseSubmissions,
  }),
  create: createTRPCRouter({
    // any member (student / champion / sponsor)
    preAssessment: createAilene.preAssessment,
    completeMaterial: createAilene.completeMaterial,
    completeVideo: createAilene.completeVideo,
    // champion only
    assignPrompt: createAilene.assignPrompt,
    assignUseCase: createAilene.assignUseCase,
    promptAssignment: createAilene.promptAssignment,
    useCaseAssignment: createAilene.useCaseAssignment,
  }),
  read: createTRPCRouter({
    // any member (student / champion / sponsor)
    announcement: readAilene.announcement,
    firstWin: readAilene.firstWin,
    competencyProfile: readAilene.competencyProfile,
    organizationStats: readAilene.organizationStats,
    materialDetail: readAilene.materialDetail,
    quizResult: readAilene.quizResult,
    preAssessment: readAilene.preAssessment,
    todayFocus: readAilene.todayFocus,
    levelProgress: readAilene.levelProgress,
    streak: readAilene.streak,
    achievements: readAilene.achievements,
    groupLeaderboard: readAilene.groupLeaderboard,
    promptAssignment: readAilene.promptAssignment,
    useCaseAssignment: readAilene.useCaseAssignment,
    // champion only
    promptSubmissionDetail: readAilene.championPromptSubmissionDetail,
    useCaseSubmissionDetail: readAilene.championUseCaseSubmissionDetail,
  }),
  update: createTRPCRouter({
    // any member (student / champion / sponsor)
    unlockLevel: updateAilene.unlockLevel,
    startQuizAttempt: updateAilene.startQuizAttempt,
    saveQuizDraft: updateAilene.saveQuizDraft,
    submitQuiz: updateAilene.submitQuiz,
    submitPromptAssignment: updateAilene.submitPromptAssignment,
    submitUseCaseAssignment: updateAilene.submitUseCaseAssignment,
    // champion only
    reviewPromptSubmission: updateAilene.reviewPromptSubmission,
    reviewUseCaseSubmission: updateAilene.reviewUseCaseSubmission,
  }),
});
