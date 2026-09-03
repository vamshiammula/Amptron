export interface CompanyStat {
  id: string
  value: number
  suffix: string
  label: string
  verified: boolean
}

export interface Testimonial {
  name: string
  place: string
  company: string
  quote: string
  verified: boolean
}

export const companyStats: CompanyStat[] = [
  {
    id: 'assembled',
    value: 10000,
    suffix: '+',
    label: 'Scooters Assembled',
    verified: false,
  },
  {
    id: 'dealers',
    value: 150,
    suffix: '+',
    label: 'Dealer Partners',
    verified: false,
  },
  {
    id: 'states',
    value: 22,
    suffix: '',
    label: 'States & UTs Covered',
    verified: false,
  },
  {
    id: 'qa',
    value: 99.2,
    suffix: '%',
    label: 'Quality Pass Rate',
    verified: false,
  },
]

export const dealerTrust = [
  { id: 'partners', value: '150+', label: 'Dealer Partners', verified: false },
  { id: 'states', value: '22', label: 'States Covered', verified: false },
  {
    id: 'satisfaction',
    value: '98%',
    label: 'Dealer Satisfaction',
    verified: false,
  },
] as const

export const testimonials: Testimonial[] = [
  {
    name: 'Rajesh Mehta',
    place: 'Ahmedabad, Gujarat',
    company: 'Apex EV Showroom',
    quote:
      'The service and spare support from Amptron is reliable. Warranty claims move quickly, and customers like the ride quality of Amptron Storm.',
    verified: false,
  },
  {
    name: 'Sanjay Krishnan',
    place: 'Chennai, Tamil Nadu',
    company: 'GreenDrive Mobility',
    quote:
      'Amptron made ARAI-certified registration straightforward for our customers. The team supported a clean launch on a floor that already stocks other EV brands.',
    verified: false,
  },
  {
    name: 'Amit Kowshik',
    place: 'Bengaluru, Karnataka',
    company: 'Kowshik E-Motors',
    quote:
      'Amptron sits beside the other EV scooters we already sell. Parts availability and a relationship manager are what we needed to grow the line.',
    verified: false,
  },
]

export const ownershipPoints = [
  {
    title: 'Service',
    body: 'Authorized workshops and partner showrooms handle routine service. Find a showroom, or raise a request with Amptron.',
    href: '/dealers/locate',
    cta: 'Find a Showroom',
  },
  {
    title: 'Warranty',
    body: 'Vehicle and battery coverage follow the signed sales or dealership policy. Claims need diagnostics through authorized partners.',
    href: '/warranty',
    cta: 'Warranty Policy',
  },
  {
    title: 'Spares',
    body: 'Parts supply is part of the product. Dealers stock kits; riders should not wait on a scooter that cannot be repaired.',
    href: '/#contact',
    cta: 'Stock Amptron',
  },
] as const

export const brandPurpose =
  'To make dependable electric mobility accessible to everyday people.'

export const brandVision =
  'To make dependable electric mobility an affordable and trusted choice for everyday transportation.'

export const brandMission =
  'To build affordable electric vehicles around the things customers actually need: reliability, strong build quality, dependable batteries, practical range, comfortable everyday use, simple charging, easy maintenance, and readily available spare parts.'

export const brandPillars = [
  {
    title: 'Dependable',
    body: 'It should start every morning, with range you can plan around.',
  },
  {
    title: 'Practical',
    body: 'Built for commutes, errands, and the roads people actually ride.',
  },
  {
    title: 'Simple',
    body: 'Everything you need. Nothing you do not. Technology must earn its place.',
  },
  {
    title: 'Accessible',
    body: 'You should not have to pay for things you do not need.',
  },
  {
    title: 'Supported',
    body: 'Service and spares are part of the product, not an afterthought.',
  },
] as const

export const decisionFilter = [
  'Safer?',
  'More dependable?',
  'More useful every day?',
  'Simpler to own?',
  'More serviceable?',
  'Enough customer value for the cost?',
] as const
