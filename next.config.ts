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
};

export default nextConfig;
