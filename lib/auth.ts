import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'

export const auth = betterAuth({
  database: pool,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  trustedOrigins: [
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
    ...(process.env.NODE_ENV === 'development'
      ? [
          'http://localhost:3000',
          'http://localhost:3001',
          // v0 preview is served through sandbox proxy domains whose origin
          // differs from V0_RUNTIME_URL, so trust those wildcard domains.
          'https://*.vercel.run',
          'https://*.vusercontent.net',
        ]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    // The app is viewed inside an iframe in both the v0 dev preview AND the
    // deployed preview. A SameSite=Lax cookie is blocked by browsers in a
    // cross-site iframe, so the session token never persists and login appears
    // to "not work" (200 response, but immediately bounced back to sign-in).
    // SameSite=None + Secure lets the session cookie be stored/sent inside the
    // iframe. This applies in production too, not just development.
    defaultCookieAttributes: {
      sameSite: 'none' as const,
      secure: true,
    },
  },
})
