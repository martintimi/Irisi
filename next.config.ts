import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "i.pinimg.com",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/vendor-portal/drops',
        destination: '/vendor-portal/products',
        permanent: false,
      },
      {
        source: '/product/:id',
        destination: '/shop/:id',
        permanent: false,
      },
      {
        source: '/products/:id',
        destination: '/shop/:id',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
