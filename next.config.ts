import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 强制无缓存：所有路由包括 _next/static 都不缓存
  // 否则 Vercel CDN 会缓存 JS bundle，新部署的代码永远拿不到
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate, proxy-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          { key: "Surrogate-Control", value: "no-store" },
        ],
      },
    ]
  },
};

export default nextConfig;