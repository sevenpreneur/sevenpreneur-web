import { createTRPCRouter } from "@/trpc/init";
import { readAdv } from "./ads/read.ads";
import { readAIResult } from "./ai_tool/read.ai_tool";
import { readArticle } from "./article/read.article";
import { readAutomation } from "./automation/read.automation";
import { readB2B } from "./b2b/read.b2b";
import { readEvent } from "./event/read.event";
import { readLMS } from "./lms/read.lms";
import { readLookup } from "./lookup/read.lookup";
import { readPlaylist } from "./playlist/read.playlist";
import { readTemplate } from "./templates/templates";
import { readTransaction } from "./transaction/read.transaction";
import { readUserData } from "./userdata/read.userdata";
import { readWA } from "./wa/read.wa";

export const readRouter = createTRPCRouter({
  // Lookup Tables //

  role: readLookup.role,
  industry: readLookup.industry,

  // User Data //

  user: readUserData.user,

  // LMS-related //

  cohort: readLMS.cohort,
  cohortPrice: readLMS.cohortPrice,
  cohortMember: readLMS.cohortMember,
  enrolledCohort: readLMS.enrolledCohort,
  module: readLMS.module,
  learning: readLMS.learning,
  material: readLMS.material,
  project: readLMS.project,
  submission: readLMS.submission,
  submissionByProject: readLMS.submissionByProject,
  attendance: readLMS.attendance,
  learningStats: readLMS.learningStats,
  learningFeedbackAnalysis: readLMS.learningFeedbackAnalysis,
  cohortRatingStats: readLMS.cohortRatingStats,
  userRating: readLMS.userRating,

  // Playlist-related //

  playlist: readPlaylist.playlist,
  enrolledPlaylist: readPlaylist.enrolledPlaylist,
  video: readPlaylist.video,

  // Event-related //

  event: readEvent.event,
  eventPrice: readEvent.eventPrice,

  // Template-related //

  template: readTemplate.template,

  // AI-tool-related //

  ai: {
    ideaValidation: readAIResult.ideaValidation,
    marketSize: readAIResult.marketSize,
    competitorGrading: readAIResult.competitorGrading,
    COGSStructure: readAIResult.COGSStructure,
    pricingStrategy: readAIResult.pricingStrategy,
    submissionAnalysis: readAIResult.submissionAnalysis,
  },

  // Transaction-related //

  discount: readTransaction.discount,
  transaction: readTransaction.transaction,

  // Article-related //

  article: readArticle.article,

  // Automations (Kill Switch) //

  automation: readAutomation.automation,

  // Ads //

  ad: {
    interstitial: readAdv.interstitial,
    ticker: readAdv.ticker,
  },

  // WhatsApp-chat-related //

  wa: {
    conversation: readWA.conversation,
    asset: readWA.asset,
    alert: readWA.alert,
  },

  // B2B Sales Pipeline //

  b2b: {
    company: readB2B.company,
    pipeline: readB2B.pipeline,
    action: readB2B.action,
  },
});
