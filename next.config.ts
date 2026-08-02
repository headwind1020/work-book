import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 禁用客户端缓存，保证看到最新代码
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
        ],
      },
    ]
  },
};

export default nextConfig;
