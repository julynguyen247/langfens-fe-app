import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React strict mode helps identify potential problems
  reactStrictMode: true,
  
  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === "production",
  },
  
  // Experimental performance optimizations
  experimental: {
    // Optimize package imports for faster builds
    optimizePackageImports: [
      "react-icons",
      "lucide-react",
      "framer-motion",
    ],
  },
  
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
};

export default nextConfig;
