import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    authInterrupts: true,
    serverActions: { bodySizeLimit: '4.5mb' },
  },
  cacheComponents: true,
  images: {
    remotePatterns: [
      new URL(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/**`),
    ],
    dangerouslyAllowLocalIP:
      new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname === '127.0.0.1',
  },
  partialPrefetching: true,
  transpilePackages: ['@foodordering/core'],
  turbopack: {
    root: path.join(__dirname, '../..'),
    rules: {
      '*.css': {
        loaders: ['@tailwindcss/turbopack'],
        as: '*.css',
      },
    },
  },
};

export default nextConfig;
