import { createTRPCRouter } from "@/trpc/init";
import { createAilene } from "./create.ailene";
import { listAilene } from "./list.ailene";
import { readGroupAilene } from "./read-group.ailene";
import { readOutcome } from "./read-outcome.ailene";
import { readPreAssessment } from "./read-pre-assessment.ailene";
import { readReportAilene } from "./read-report.ailene";
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
    levelMaterials: readAilene.levelMaterials,
    quizResult: readAilene.quizResult,
    preAssessment: createTRPCRouter({
      // member-scoped: the logged-in member's own pre-assessment
      mine: readAilene.preAssessment,
      // sponsor-scoped org aggregations (optional group_id filter)
      departments: readPreAssessment.departments,
      overview: readPreAssessment.overview,
      pillars: readPreAssessment.pillars,
      usageFrequency: readPreAssessment.usageFrequency,
      tools: readPreAssessment.tools,
      teamMaturity: readPreAssessment.teamMaturity,
      safetyGaps: readPreAssessment.safetyGaps,
      topUseCases: readPreAssessment.topUseCases,
      voice: readPreAssessment.voice,
    }),
    group: createTRPCRouter({
      departments: readGroupAilene.departments,
      overview: readGroupAilene.overview,
      levelDistribution: readGroupAilene.levelDistribution,
      topUseCases: readGroupAilene.topUseCases,
      attentionMembers: readGroupAilene.attentionMembers,
    }),
    outcome: createTRPCRouter({
      // sponsor-scoped end-of-program results (current state)
      overview: readOutcome.overview,
      levelDistribution: readOutcome.levelDistribution,
      topPerformers: readOutcome.topPerformers,
    }),
    report: createTRPCRouter({
      champion: readReportAilene.championReport,
    }),
    todayFocus: readAilene.todayFocus,
    levelProgress: readAilene.levelProgress,
    streak: readAilene.streak,
    achievements: readAilene.achievements,
    groupLeaderboard: readAilene.groupLeaderboard,
    promptAssignment: readAilene.promptAssignment,
    useCaseAssignment: readAilene.useCaseAssignment,
    // sponsor only
    executiveView: readAilene.executiveView,
    weeklyTrends: readAilene.weeklyTrends,
    levelDistribution: readAilene.levelDistribution,
    organizationLeaderboard: readAilene.organizationLeaderboard,
    // champion only
    memberDetail: readAilene.championMemberDetail,
    promptSubmissionDetail: readAilene.championPromptSubmissionDetail,
    useCaseSubmissionDetail: readAilene.championUseCaseSubmissionDetail,
  }),
  update: createTRPCRouter({
    // sponsor only
    announcement: updateAilene.announcement,
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
