"use client";
import { useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { toast } from "sonner";

interface AppVideoPlayerProps {
  videoId: string;
}

interface VideoStreamUrlResponse {
  status: number;
  message?: string;
  embed_url?: string;
  refresh_after_seconds?: number | null;
}

export default function AppVideoPlayer(props: AppVideoPlayerProps) {
  const [embedUrl, setEmbedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isMounted = true;
    let refreshTimeout: ReturnType<typeof setTimeout> | null = null;

    const fetchData = async () => {
      if (!props.videoId) return;

      if (isMounted) {
        setIsLoading(true);
        setHasError(false);
        setEmbedUrl(null);
      }

      try {
        const response = await fetch(`/api/stream/url/${props.videoId}`, {
          cache: "no-store",
        });
        const data = (await response.json()) as VideoStreamUrlResponse;

        if (!response.ok || data.status !== 200 || !data.embed_url) {
          throw new Error(data.message || "Invalid video ID");
        }

        if (isMounted) {
          setEmbedUrl(data.embed_url);
          setHasError(false);

          if (data.refresh_after_seconds) {
            refreshTimeout = setTimeout(() => {
              fetchData();
            }, data.refresh_after_seconds * 1000);
          }
        }
      } catch (error) {
        console.error("Failed to fetch Bunny Stream embed URL:", error);
        if (isMounted) {
          setEmbedUrl(null);
          setHasError(true);
          toast.error("Invalid Video ID");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isMounted = false;
      if (refreshTimeout) clearTimeout(refreshTimeout);
    };
  }, [props.videoId]);

  if (isLoading) {
    return (
      <div className="flex w-full aspect-video items-center justify-center bg-black">
        <DotLottieReact
          src="/animation/loading-spinner.lottie"
          loop
          autoplay
          speed={1}
          style={{ width: 240 }}
        />
      </div>
    );
  }

  if (!embedUrl || hasError) {
    return (
      <div className="flex w-full aspect-video items-center justify-center bg-black">
        <p className=" text-white text-sm lg:text-base">
          Video unavailable. Please refresh the page.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video overflow-hidden bg-black">
      <iframe
        key={embedUrl}
        className="absolute inset-0 h-full w-full border-0"
        src={embedUrl}
        title="Bunny Stream video player"
        loading="lazy"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
        allowFullScreen
      />
    </div>
  );
}
