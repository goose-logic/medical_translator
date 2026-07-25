import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Stagehand/Browserbase log through pino, which resolves its `pino-pretty`
  // transport dynamically in a worker thread by real file path. Bundling them
  // breaks that resolution ("unable to determine transport target for
  // pino-pretty"), so keep the whole browser-automation + logging stack
  // external and loaded from node_modules at runtime.
  serverExternalPackages: [
    '@browserbasehq/stagehand',
    '@browserbasehq/sdk',
    'pino',
    'pino-pretty',
  ],
}

export default nextConfig
