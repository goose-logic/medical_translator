import PlaceholderFeature from '@/components/placeholder-feature'

export default function NavigationPage() {
  return (
    <PlaceholderFeature
      title="Healthcare Facilities Navigation"
      description="Find and navigate to NHS healthcare facilities"
      features={[
        'Find nearby NHS clinics and hospitals',
        'Get directions using Google Maps',
        'View clinic opening hours',
        'Get public transport directions',
      ]}
      icon="🗺️"
    />
  )
}
