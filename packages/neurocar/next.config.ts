import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // domains: [
    //   "images.unsplash.com", // Unsplash
    //   "images.pexels.com", // Pexels
    //   "res.cloudinary.com", // Cloudinary
    // ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
