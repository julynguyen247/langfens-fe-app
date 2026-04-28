import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // React strict mode helps identify potential problems
  reactStrictMode: true,

  // Pin both Turbopack and Webpack workspace roots so neither inferring
  // mechanism walks up to /home/khoa/Projects/langfens/ (where a stray
  // package-lock.json without a sibling package.json lives) and loses track
  // of node_modules during dev.
  turbopack: {
    root: path.resolve(__dirname),
  },
  outputFileTracingRoot: path.resolve(__dirname),

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
      "three",
      "@react-three/drei",
    ],
  },
  
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.wp.com",
      },
      {
        protocol: "https",
        hostname: "**.wordpress.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "http",
        hostname: "images.mini-ielts.com",
      },
      {
        protocol: "https", 
        hostname: "images.mini-ielts.com",
      },
    ],
  },
};

export default nextConfig;
