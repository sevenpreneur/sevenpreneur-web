import { createTRPCRouter } from "@/trpc/init";
import { deleteAITool } from "./ai_tool/delete.ai_tool";
import { deleteWA } from "./wa/delete.wa";
import { deleteArticle } from "./article/delete.article";
import { deleteB2B } from "./b2b/delete.b2b";
import { deleteEvent } from "./event/delete.event";
import { deleteLMS } from "./lms/delete.lms";
import { deletePlaylist } from "./playlist/delete.playlist";
import { deleteTemplate } from "./templates/templates";
import { deleteTransaction } from "./transaction/delete.transaction";
import { deleteUserData } from "./userdata/delete.userdata";

export const deleteRouter = createTRPCRouter({
  // User Data //

  user: deleteUserData.user,

  // LMS-related //

  cohort: deleteLMS.cohort,
  cohortPrice: deleteLMS.cohortPrice,
  cohortMember: deleteLMS.cohortMember,
  module: deleteLMS.module,
  learning: deleteLMS.learning,
  material: deleteLMS.material,
  discussionStarter: deleteLMS.discussionStarter,
  discussionReply: deleteLMS.discussionReply,
  project: deleteLMS.project,
  submission: deleteLMS.submission,

  // Playlist-related //

  playlist: deletePlaylist.playlist,
  educatorPlaylist: deletePlaylist.educatorPlaylist,
  video: deletePlaylist.video,

  // Event-related //

  event: deleteEvent.event,
  eventPrice: deleteEvent.eventPrice,

  // Template-related //

  template: deleteTemplate.template,

  // AI-tool-related //

  aiResult: deleteAITool.aiResult,
  aiConversation: deleteAITool.aiConversation,

  // Transaction-related //

  discount: deleteTransaction.discount,

  // Article-related //

  articleCategory: deleteArticle.articleCategory,
  article: deleteArticle.article,

  // WhatsApp-chat-related //

  wa: {
    asset: deleteWA.asset,
    template: deleteWA.template,
    alert: deleteWA.alert,
  },

  // B2B Sales Pipeline //

  b2b: {
    pipeline: deleteB2B.pipeline,
    action: deleteB2B.action,
  },
});
