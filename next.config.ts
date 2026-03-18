import type { NextConfig } from "next";

// Dynamically allow the actual Supabase domain (supports self-hosted HTTP instances)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
let supabasePattern: { protocol: "http" | "https"; hostname: string } | null = null;
if (supabaseUrl) {
  try {
    const parsed = new URL(supabaseUrl);
    supabasePattern = {
      protocol: parsed.protocol.replace(":", "") as "http" | "https",
      hostname: parsed.hostname,
    };
  } catch {
    // ignore invalid URL
  }
}

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      ...(supabasePattern ? [supabasePattern] : []),
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
