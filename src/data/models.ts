import cruise from '../assets/images/cruise.webp'
import storm from '../assets/images/storm.webp'
import volt from '../assets/images/volt.webp'

export interface ModelSpec {
  label: string
  value: string
}

export interface ScooterModel {
  slug: string
  name: string
  tagline: string
  description: string
  image: string
  featured: boolean
  highlights: Array<{ label: string; value: string; note: string }>
  specs: ModelSpec[]
  features: string[]
}

export const scooterModels: ScooterModel[] = [
  {
    slug: 'amptron-volt',
    name: 'Amptron Volt',
    tagline: 'Smart low-speed commuter for dense city routes.',
    description:
      'Agile, cost-efficient city commuter — easy to own, easy to service, built for short urban hops and high-frequency use.',
    image: volt,
    featured: false,
    highlights: [
      {
        label: 'Certified Range',
        value: '80 km',
        note: 'Single-charge city coverage',
      },
      {
        label: 'Top Speed',
        value: '25 km/h',
        note: 'Low-speed category compliance',
      },
      {
        label: 'Charge Time',
        value: '3.5 hrs',
        note: 'Fast turnaround between shifts',
      },
    ],
    specs: [
      { label: 'Dimensions (L x W x H)', value: '1810 x 690 x 1120 mm' },
      { label: 'Wheelbase', value: '1290 mm' },
      { label: 'Ground Clearance', value: '165 mm' },
      { label: 'Kerb Weight', value: '89 kg' },
      { label: 'Payload', value: '145 kg' },
      { label: 'Motor Output', value: '1500W BLDC hub motor' },
      { label: 'Battery Type', value: 'Lithium-Ion, AIS 156 Phase 2' },
      { label: 'Battery Capacity', value: '2.0 kWh' },
      { label: 'System Voltage', value: '60V' },
      { label: 'Range Per Charge', value: 'Up to 80 km' },
      { label: 'Charger Input', value: 'AC 180-265V, 50Hz' },
      { label: 'Charger Output', value: '67.2V, 8A' },
      { label: 'Charging Time', value: '3.5 hours' },
      { label: 'Front Suspension', value: 'Telescopic fork' },
      { label: 'Rear Suspension', value: 'Hydraulic dual shock' },
      { label: 'Tyres', value: '90/90-12 tubeless' },
      { label: 'Brakes', value: 'Front disc / rear drum with CBS' },
    ],
    features: [
      'Digital dashboard display',
      'Reverse assist mode',
      'Remote lock/unlock',
      'Mobile charging socket',
      'Side-stand sensor',
      'Regenerative braking support',
    ],
  },
  {
    slug: 'amptron-storm',
    name: 'Amptron Storm',
    tagline: 'Performance-first city and peri-urban scooter.',
    description:
      'High-torque acceleration, rugged suspension, and practical range — built for mixed-terrain commutes and confident test rides.',
    image: storm,
    featured: true,
    highlights: [
      {
        label: 'Certified Range',
        value: '120 km',
        note: 'Balanced for full-day field work',
      },
      {
        label: 'Top Speed',
        value: '65 km/h',
        note: 'Comfortable city-to-suburban travel',
      },
      {
        label: 'Charge Time',
        value: '4.0 hrs',
        note: 'Optimized for daytime recharge cycles',
      },
    ],
    specs: [
      { label: 'Dimensions (L x W x H)', value: '1860 x 700 x 1135 mm' },
      { label: 'Wheelbase', value: '1325 mm' },
      { label: 'Ground Clearance', value: '170 mm' },
      { label: 'Kerb Weight', value: '95 kg' },
      { label: 'Payload', value: '150 kg' },
      { label: 'Motor Output', value: '2500W BLDC hub motor' },
      { label: 'Battery Type', value: 'Lithium-Ion with smart BMS' },
      { label: 'Battery Capacity', value: '2.65 kWh' },
      { label: 'System Voltage', value: '60V' },
      { label: 'Range Per Charge', value: 'Up to 120 km' },
      { label: 'Charger Input', value: 'AC 180-265V, 50Hz' },
      { label: 'Charger Output', value: '71.4V, 10A' },
      { label: 'Charging Time', value: '4.0 hours' },
      { label: 'Front Suspension', value: 'Telescopic fork' },
      { label: 'Rear Suspension', value: 'Swing arm with gas shock' },
      { label: 'Tyres', value: '90/90-12 tubeless' },
      { label: 'Brakes', value: 'Disc + drum with CBS' },
    ],
    features: [
      'Keyless start',
      'Ride modes (Eco, City, Power)',
      'Digital TFT console',
      'Anti-theft alarm',
      'Regenerative braking',
      'USB charging and navigation mount',
    ],
  },
  {
    slug: 'amptron-cruise',
    name: 'Amptron Cruise',
    tagline: 'Long-range flagship for all-day rides.',
    description:
      'A comfort-focused long-range scooter for extended commutes, road presence, and confident highway stretches.',
    image: cruise,
    featured: false,
    highlights: [
      {
        label: 'Certified Range',
        value: '150 km',
        note: 'Extended touring capability',
      },
      { label: 'Top Speed', value: '80 km/h', note: 'Fast regional mobility' },
      {
        label: 'Charge Time',
        value: '4.5 hrs',
        note: 'High-capacity pack recharge',
      },
    ],
    specs: [
      { label: 'Dimensions (L x W x H)', value: '1900 x 720 x 1150 mm' },
      { label: 'Wheelbase', value: '1350 mm' },
      { label: 'Ground Clearance', value: '175 mm' },
      { label: 'Kerb Weight', value: '102 kg' },
      { label: 'Payload', value: '155 kg' },
      { label: 'Motor Output', value: '3200W BLDC hub motor' },
      { label: 'Battery Type', value: 'Advanced Lithium-Ion' },
      { label: 'Battery Capacity', value: '3.4 kWh' },
      { label: 'System Voltage', value: '72V' },
      { label: 'Range Per Charge', value: 'Up to 150 km' },
      { label: 'Charger Input', value: 'AC 180-265V, 50Hz' },
      { label: 'Charger Output', value: '84V, 10A' },
      { label: 'Charging Time', value: '4.5 hours' },
      { label: 'Front Suspension', value: 'Telescopic hydraulic' },
      { label: 'Rear Suspension', value: 'Mono-shock adjustable' },
      { label: 'Tyres', value: '100/80-12 tubeless' },
      { label: 'Brakes', value: 'Dual disc with CBS' },
    ],
    features: [
      'Cruise control',
      'Smart dashboard with telemetry',
      'Reverse mode',
      'Keyless proximity unlock',
      'Wide floorboard and pillion comfort kit',
      'Remote diagnostics readiness',
    ],
  },
]

export function getModelBySlug(slug: string): ScooterModel | undefined {
  return scooterModels.find((model) => model.slug === slug)
}
