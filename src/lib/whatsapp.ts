import https from "https";

export type WhatsappMessageResponse = {
  messaging_product?: "whatsapp";
  contacts?: {
    input: string;
    wa_id: string;
  }[];
  messages?: {
    id: string;
  }[];
  error?: {
    message: string;
    type: string;
    code: number;
    error_data: {
      messaging_product: "whatsapp";
      details: string;
    };
    fbtrace_id: string;
  };
};

type WhatsappMessageRequestType =
  | "text"
  | "audio"
  | "document"
  | "image"
  | "sticker"
  | "video"
  | "template";

const whatsappMessageRequest = (
  userPhoneNumber: string,
  type: WhatsappMessageRequestType,
  payload: object
): Promise<WhatsappMessageResponse> => {
  return new Promise((resolve, reject) => {
    const whatsappRequestBody = JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: userPhoneNumber,
      type: type,
      ...payload,
    });

    const whatsappRequestOptions: https.RequestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(whatsappRequestBody),
        Authorization: "Bearer " + process.env.WHATSAPP_ACCESS_TOKEN,
      },
    };

    const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const whatsappReq = https.request(
      `https://graph.facebook.com/v23.0/${whatsappPhoneNumberId}/messages`,
      whatsappRequestOptions,
      (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const parsedData = JSON.parse(data);
            resolve(parsedData);
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    whatsappReq.on("error", (e) => {
      reject(e);
    });

    whatsappReq.write(whatsappRequestBody);
    whatsappReq.end();
  });
};

// https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/text-messages/?locale=en_US
export const whatsappTextMessageRequest = (
  userPhoneNumber: string,
  message: string,
  replyToWamId?: string
) => {
  return whatsappMessageRequest(userPhoneNumber, "text", {
    text: {
      preview_url: true,
      body: message,
    },
    ...(replyToWamId ? { context: { message_id: replyToWamId } } : {}),
  });
};

// https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/audio-messages/?locale=en_US
export const whatsappAudioMessageRequest = (
  userPhoneNumber: string,
  audioUrl: string,
  isVoice: boolean
) => {
  return whatsappMessageRequest(userPhoneNumber, "audio", {
    audio: {
      link: audioUrl,
      voice: isVoice,
    },
  });
};

// https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/document-messages/?locale=en_US
export const whatsappDocumentMessageRequest = (
  userPhoneNumber: string,
  documentUrl: string,
  caption: string | undefined,
  fileName: string
) => {
  return whatsappMessageRequest(userPhoneNumber, "document", {
    document: {
      link: documentUrl,
      caption: caption,
      filename: fileName,
    },
  });
};

// https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/image-messages/?locale=en_US
export const whatsappImageMessageRequest = (
  userPhoneNumber: string,
  imageUrl: string,
  caption: string | undefined
) => {
  return whatsappMessageRequest(userPhoneNumber, "image", {
    image: {
      link: imageUrl,
      caption: caption,
    },
  });
};

// https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/sticker-messages/?locale=en_US
export const whatsappStickerMessageRequest = (
  userPhoneNumber: string,
  stickerUrl: string
) => {
  return whatsappMessageRequest(userPhoneNumber, "sticker", {
    sticker: {
      link: stickerUrl,
    },
  });
};

// https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/marketing-templates/custom-marketing-templates/?locale=en_US
export const whatsappTemplateMessageRequest = (
  userPhoneNumber: string,
  templateName: string,
  langCode: string,
  parameters: { name: string; text: string }[]
) => {
  const bodyParamList = parameters.map((entry) => {
    return {
      type: "text",
      parameter_name: entry.name,
      text: entry.text,
    };
  });
  return whatsappMessageRequest(userPhoneNumber, "template", {
    template: {
      name: templateName,
      language: { code: langCode },
      components: [{ type: "body", parameters: bodyParamList }],
    },
  });
};

export type WhatsappTemplateComponent = {
  type: string;
  format?: string;
  text?: string;
  buttons?: { type?: string; text?: string }[];
  example?: unknown;
};

export type WhatsappTemplate = {
  id: string;
  name: string;
  language: string;
  category: string;
  parameter_format?: string;
  status: string;
  components: WhatsappTemplateComponent[];
  quality_score?: { score?: string };
  rejected_reason?: string;
};

const WHATSAPP_TEMPLATE_FIELDS =
  "id,name,language,category,parameter_format,status,components,quality_score,rejected_reason";

// https://developers.facebook.com/docs/whatsapp/business-management-api/message-templates
// Fetch all message templates from Meta (handles pagination).
export const whatsappListTemplates = async (): Promise<WhatsappTemplate[]> => {
  const businessId = process.env.WHATSAPP_BUSINESS_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  const templates: WhatsappTemplate[] = [];
  let url: string | undefined =
    `https://graph.facebook.com/v23.0/${businessId}/message_templates` +
    `?fields=${WHATSAPP_TEMPLATE_FIELDS}&limit=100`;

  while (url) {
    const response = await fetch(url, {
      method: "GET",
      headers: { Authorization: "Bearer " + token },
    });
    if (!response.ok) {
      throw new Error(
        `WhatsApp list templates failed: ${response.status} ${response.statusText}`
      );
    }
    const json = (await response.json()) as {
      data?: WhatsappTemplate[];
      paging?: { next?: string };
    };
    if (Array.isArray(json.data)) {
      templates.push(...json.data);
    }
    url = json.paging?.next;
  }

  return templates;
};

// Fetch a single template by name + language. Meta's `name` filter returns
// every language variant for that name, so we pick the matching language.
export const whatsappGetTemplate = async (
  name: string,
  langCode: string
): Promise<WhatsappTemplate | null> => {
  const businessId = process.env.WHATSAPP_BUSINESS_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;

  const url =
    `https://graph.facebook.com/v23.0/${businessId}/message_templates` +
    `?name=${encodeURIComponent(name)}&fields=${WHATSAPP_TEMPLATE_FIELDS}&limit=100`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: "Bearer " + token },
  });
  if (!response.ok) {
    throw new Error(
      `WhatsApp get template failed: ${response.status} ${response.statusText}`
    );
  }
  const json = (await response.json()) as { data?: WhatsappTemplate[] };
  const list = json.data ?? [];
  return list.find((t) => t.name === name && t.language === langCode) ?? null;
};

// https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/video-messages/?locale=en_US
export const whatsappVideoMessageRequest = (
  userPhoneNumber: string,
  videoUrl: string,
  caption: string | undefined
) => {
  return whatsappMessageRequest(userPhoneNumber, "video", {
    video: {
      link: videoUrl,
      caption: caption,
    },
  });
};

export type WhatsappGetMediaURLResponse = {
  messaging_product: "whatsapp";
  url: string;
  mime_type: string;
  sha256: string;
  file_size: string;
  id: string;
};

// https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/media/?locale=en_US#get-media-url
export const whatsappGetMediaURLRequest = (
  mediaID: string
): Promise<WhatsappGetMediaURLResponse> => {
  return new Promise((resolve, reject) => {
    const whatsappRequestOptions: https.RequestOptions = {
      method: "GET",
      headers: {
        Authorization: "Bearer " + process.env.WHATSAPP_ACCESS_TOKEN,
      },
    };

    const whatsappPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const whatsappReq = https.request(
      `https://graph.facebook.com/v23.0/${mediaID}/?phone_number_id=${whatsappPhoneNumberId}`,
      whatsappRequestOptions,
      (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const parsedData = JSON.parse(data);
            resolve(parsedData);
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    whatsappReq.on("error", (e) => {
      reject(e);
    });

    whatsappReq.end();
  });
};

// https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/media/?locale=en_US#download-media
export const whatsappDownloadMediaRequest = async (
  mediaURL: string
): Promise<Buffer> => {
  const response = await fetch(mediaURL, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + process.env.WHATSAPP_ACCESS_TOKEN,
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(
      `WhatsApp media download failed: ${response.status} ${response.statusText}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};
