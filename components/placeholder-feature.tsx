import Link from 'next/link'

interface PlaceholderFeatureProps {
  title: string
  description: string
  features: string[]
  icon: string
}

export default function PlaceholderFeature({
  title,
  description,
  features,
  icon,
}: PlaceholderFeatureProps) {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-start gap-4">
          <span className="text-5xl">{icon}</span>
          <div>
            <h1 className="text-3xl font-bold">{title}</h1>
            <p className="text-muted mt-2">{description}</p>
          </div>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-secondary rounded-lg border border-border p-8 mb-6">
          <div className="text-center">
            <div className="inline-block p-4 bg-primary bg-opacity-10 rounded-full mb-4">
              <span className="text-4xl">🚀</span>
            </div>
            <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
            <p className="text-muted max-w-md mx-auto">
              This feature is being developed with care to ensure it meets the needs of NHS users. We&apos;re working
              hard to bring it to you.
            </p>
          </div>
        </div>

        {/* Features List */}
        <div className="bg-secondary rounded-lg border border-border p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">What you&apos;ll be able to do:</h3>
          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="text-accent mt-1">✓</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Your Privacy is Protected</h3>
          <p className="text-blue-800 text-sm">
            When this feature launches, all your data will be encrypted and securely stored. We maintain an audit log
            of all actions for complete transparency.
          </p>
        </div>

        {/* Back Link */}
        <Link href="/" className="text-primary hover:underline font-medium">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
