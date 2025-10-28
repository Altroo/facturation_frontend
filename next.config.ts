import type {NextConfig} from "next";
import path from "path";

const nextConfig: NextConfig = {
  reactCompiler: true,
  sassOptions: {
    silenceDeprecations: ['legacy-js-api'],
    includePaths: [
      path.join(__dirname, "src", "styles"),
      path.join(__dirname, "public"),
    ],
  },
};

export default nextConfig;
