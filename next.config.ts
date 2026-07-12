import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "/f/**",
      },
      // UploadThing sometimes also serves from this domain:
      {
        protocol: "https",
        hostname: "*.ufs.sh",
      },
    ],
  },
};

export default nextConfig;
