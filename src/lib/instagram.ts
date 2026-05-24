import https from "https";

export type InstagramCommentResponse = {
  id?: string;
  error?: {
    message: string;
    type: string;
    code: number;
    error_subcode?: number;
    fbtrace_id: string;
  };
};

const instagramGraphApiRequest = (
  endpoint: string,
  payload: object
): Promise<InstagramCommentResponse> => {
  return new Promise((resolve, reject) => {
    const requestBody = JSON.stringify(payload);

    const requestOptions: https.RequestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody),
        Authorization: "Bearer " + process.env.META_IG_ACCESS_TOKEN,
      },
    };

    const req = https.request(
      `https://graph.facebook.com/v23.0/${endpoint}`,
      requestOptions,
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

    req.on("error", (e) => {
      reject(e);
    });

    req.write(requestBody);
    req.end();
  });
};

// https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-comment/replies
export const instagramReplyToCommentRequest = (
  commentId: string,
  message: string
) => {
  return instagramGraphApiRequest(`${commentId}/replies`, { message });
};

// https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-media/comments
export const instagramPostCommentRequest = (
  mediaId: string,
  message: string
) => {
  return instagramGraphApiRequest(`${mediaId}/comments`, { message });
};
