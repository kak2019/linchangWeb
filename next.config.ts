import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@narrativeos/ui"],
  allowedDevOrigins: ["127.0.0.1"],
  async rewrites() {
    const workbench = (process.env.NEXT_PUBLIC_WORKBENCH_URL || "https://www.narrativeos.cn/narrativeos/").replace(/\/$/, "");
    return ["auth/me", "credits/balance", "payments/subscription", "admin/me"].map(path => ({
      source: `/api/workbench-account/${path}`,
      destination: `${workbench}/api/forge/${path}`,
    }));
  },
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "linchangweb.oss-cn-beijing.aliyuncs.com",
        pathname: "/WeChatGroupPic/**",
      },
    ],
  },
};

export default nextConfig;
