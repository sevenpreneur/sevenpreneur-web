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

export type InstagramMediaContextResponse = {
  id?: string;
  caption?: string;
  error?: {
    message?: string;
    type?: string;
    code?: number;
    error_subcode?: number;
    fbtrace_id?: string;
  };
};

const instagramGraphApiPostRequest = (
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
      `https://graph.instagram.com/v23.0/${endpoint}`,
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

const instagramGraphApiGetRequest = <T>(
  endpoint: string,
  params: Record<string, string>
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const url = new URL(`https://graph.instagram.com/v23.0/${endpoint}`);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const requestOptions: https.RequestOptions = {
      method: "GET",
      headers: {
        Authorization: "Bearer " + process.env.META_IG_ACCESS_TOKEN,
      },
    };

    const req = https.request(url, requestOptions, (res) => {
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
    });

    req.on("error", (e) => {
      reject(e);
    });

    req.end();
  });
};

// https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-comment/replies
export const instagramReplyToCommentRequest = (
  commentId: string,
  message: string
) => {
  return instagramGraphApiPostRequest(`${commentId}/replies`, { message });
};

// https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-media/comments
export const instagramPostCommentRequest = (
  mediaId: string,
  message: string
) => {
  return instagramGraphApiPostRequest(`${mediaId}/comments`, { message });
};

// https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-media
export const instagramGetMediaContextRequest = (mediaId: string) => {
  return instagramGraphApiGetRequest<InstagramMediaContextResponse>(mediaId, {
    fields: "id,caption",
  });
};
