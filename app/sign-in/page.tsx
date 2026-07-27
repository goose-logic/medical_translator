import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { AuthForm } from '@/components/auth-form'
import { ensureDemoUser } from '@/app/actions/demo'

export default async function SignInPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session?.user) redirect('/')

  // Make sure the demo account (test@test.com) exists so it can be signed in to,
  // even on a freshly provisioned, empty database. Idempotent — a no-op once
  // the account has been created.
  await ensureDemoUser()

  return <AuthForm mode="sign-in" />
}
