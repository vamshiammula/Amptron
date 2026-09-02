export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  publishedAt: string
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'dealer-playbook-for-tier-2-cities',
    title: 'Dealer Playbook for Tier-2 EV Markets',
    excerpt:
      'A practical guide to launch EV retail in emerging cities with strong service readiness and demand planning.',
    publishedAt: '2026-08-20',
  },
  {
    slug: 'how-to-run-high-conversion-test-rides',
    title: 'How to Run High-Conversion Test Ride Events',
    excerpt:
      'Tactics for showroom owners to improve walk-in to booking conversion through structured test ride programs.',
    publishedAt: '2026-08-12',
  },
  {
    slug: 'battery-safety-service-readiness-checklist',
    title: 'Battery Safety and Service Readiness Checklist',
    excerpt:
      'What every workshop should validate before scaling EV volumes in high-temperature regions.',
    publishedAt: '2026-07-30',
  },
]
