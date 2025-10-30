import type { NextConfig } from "next";
import type { RemotePattern } from "next/dist/shared/lib/image-config";
import path from "path";

const isDev = process.env.NODE_ENV === "development";

const remotePatterns: RemotePattern[] = [
  {
    protocol: "http",
    hostname: "127.0.0.1",
    port: "8000",
    pathname: "/media/user_avatars/**",
  },
];

const nextConfig: NextConfig = {
  reactCompiler: true,

  sassOptions: {
    includePaths: [
      path.join(__dirname, "src", "styles"),
      path.join(__dirname, "public"),
    ],
  },

  images: {
    unoptimized: isDev,
    remotePatterns,
  },
};

export default nextConfig;
