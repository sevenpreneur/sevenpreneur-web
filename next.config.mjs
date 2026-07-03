import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yt3.googleusercontent.com",
        port: "",
      },
      {
        protocol: "https",
        hostname: "tskubmriuclmbcfmaiur.supabase.co",
        port: "",
      },
    ],
  },
  // Force revalidation on the marketing domains so a cookie-dependent response never gets served stale.
  async headers() {
    return [
      {
        source: "/:all*",
        has: [
          {
            type: "header",
            key: "host",
            value: "www.(sevenpreneur.com|example.com).*",
          },
        ],
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // No session cookie on agora/admin (prod) -> bounce to the login page on the main domain.
      {
        source: "/(.*)",
        has: [
          {
            type: "header",
            key: "host",
            value: "(agora|admin).sevenpreneur.com.*",
          },
        ],
        missing: [
          {
            type: "cookie",
            key: "session_token",
          },
        ],
        destination: "https://www.sevenpreneur.com/auth/login",
        basePath: false,
        permanent: false,
      },
      // Same as above, but for the local/ngrok dev host.
      {
        source: "/(.*)",
        has: [
          {
            type: "header",
            key: "host",
            value: "(agora|admin).example.com:3000.*",
          },
        ],
        missing: [
          {
            type: "cookie",
            key: "session_token",
          },
        ],
        destination: "https://www.example.com:3000/auth/login",
        basePath: false,
        permanent: false,
      },
      // Already signed in -> don't show the login page again.
      {
        source: "/auth(.*)",
        has: [
          {
            type: "header",
            key: "host",
            value: "www.(sevenpreneur.com|example.com).*",
          },
          {
            type: "cookie",
            key: "session_token",
            value: undefined,
          },
        ],
        destination: "/",
        permanent: false,
      },
    ];
  },
  async rewrites() {
    // Falls back to a domain nobody owns so the ngrok rewrite below is a no-op until NGROK_DOMAIN is set.
    let ngrokDomain = "ngrok-no-domain.ngrok-free.app";
    if (process.env.DOMAIN_MODE === "local") {
      const ngrokDomainEnv = process.env.NGROK_DOMAIN;
      if (ngrokDomainEnv !== undefined && ngrokDomainEnv !== "") {
        ngrokDomain = ngrokDomainEnv;
      }
    }
    return {
      // Hide the internal route groups ("/admin", "/agora", "/api", "/www") from direct access.
      beforeFiles: [
        {
          source: "/(admin|agora|api|www)",
          destination: "/_not-found/page",
        },
      ],
      afterFiles: [
        // Any other subdomain (tenant.sevenpreneur.com) -> route into its matching folder.
        {
          source: "/:path*",
          has: [
            {
              type: "header",
              key: "host",
              value: "(?<subdomain>[^.]+).(sevenpreneur.com|example.com).*",
            },
          ],
          destination: "/:subdomain/:path*",
        },
        // Bare apex domain -> the marketing site.
        {
          source: "/:path*",
          has: [
            {
              type: "header",
              key: "host",
              value: "(sevenpreneur.com|example.com).*",
            },
          ],
          destination: "/www/:path*",
        },
        // Vercel preview deployments also serve the marketing site.
        {
          source: "/:path*",
          has: [
            {
              type: "header",
              key: "host",
              value: "sevenpreneur(-[^.]+).vercel.app.*",
            },
          ],
          destination: "/www/:path*",
        },
        // Requests coming in through the local ngrok tunnel are hitting the API directly.
        {
          source: "/:path*",
          has: [
            {
              type: "header",
              key: "host",
              value: ngrokDomain + ".*",
            },
          ],
          destination: "/api/:path*",
        },
      ],
    };
  },
  allowedDevOrigins: ["www.example.com", "*.example.com"],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "sevenpreneur.com",
        "*.sevenpreneur.com",
        "example.com",
        "*.example.com",
        process.env.NGROK_DOMAIN,
      ],
    },
  },
};

export default nextConfig;
