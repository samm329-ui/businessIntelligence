import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static optimization where possible
  output: 'standalone',
  
  // Image optimization
  images: {
    unoptimized: true
  },
  
  // Environment variables that should be available at build time
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  }
};

export default nextConfig;
