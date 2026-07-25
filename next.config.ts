import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Stagehand/Browserbase log through pino, which loads its `pino-pretty`
  // transport in a worker thread via a dynamic path. Next.js bundling rewrites
  // those paths and breaks the lookup ("unable to determine transport target
  // for pino-pretty"). Keeping these packages external means they're required
  // straight from node_modules at runtime, so pino can resolve the transport.
  serverExternalPackages: [
    "@browserbasehq/stagehand",
    "@browserbasehq/sdk",
    "pino",
    "pino-pretty",
  ],
}

export default nextConfig
