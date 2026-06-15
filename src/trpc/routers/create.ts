import { createTRPCRouter } from "@/trpc/init";
import { createArticle } from "./article/create.article";
import { createAutomation } from "./automation/create.automation";
import { createB2B } from "./b2b/create.b2b";
import { createWA } from "./wa/create.wa";
import { createEvent } from "./event/create.event";
import { createLMS } from "./lms/create.lms";
import { createPlaylist } from "./playlist/create.playlist";
import { createTemplate } from "./templates/templates";
import { createTransaction } from "./transaction/create.transaction";
import { createUserData } from "./userdata/create.userdata";

export const createRouter = createTRPCRouter({
  // User Data //

  user: createUserData.user,

  // LMS-related //

  cohort: createLMS.cohort,
  cohortPrice: createLMS.cohortPrice,
  cohortMember: createLMS.cohortMember,
  module: createLMS.module,
  learning: createLMS.learning,
  material: createLMS.material,
  discussionStarter: createLMS.discussionStarter,
  discussionReply: createLMS.discussionReply,
  project: createLMS.project,
  submission: createLMS.submission,
  checkIn: createLMS.checkIn,
  checkOut: createLMS.checkOut,
  attendance: createLMS.attendance,
  submitRating: createLMS.submitRating,

  // Playlist-related //

  playlist: createPlaylist.playlist,
  educatorPlaylist: createPlaylist.educatorPlaylist,
  video: createPlaylist.video,

  // Event-related //

  event: createEvent.event,
  eventPrice: createEvent.eventPrice,

  // Template-related //

  template: createTemplate.template,

  // Transaction-related //

  discount: createTransaction.discount,

  // Article-related //

  articleCategory: createArticle.articleCategory,
  article: createArticle.article,

  // Automations (Kill Switch) //

  automation: createAutomation.automation,

  // WhatsApp-chat-related //

  wa: {
    asset: createWA.asset,
    alert: createWA.alert,
  },

  // B2B Sales Pipeline //

  b2b: {
    pipeline: createB2B.pipeline,
    action: createB2B.action,
  },
});
