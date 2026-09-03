import cruise from '../assets/images/cruise.webp'
import storm from '../assets/images/storm.webp'
import volt from '../assets/images/volt.webp'

export interface ModelSpec {
  label: string
  value: string
}

export interface ModelHighlight {
  label: string
  value: string
  note: string
}

export interface ModelPricing {
  exShowroomInr: number
  note?: string
  placeholder?: boolean
}

export interface ModelColour {
  name: string
  hex: string
  image?: string
}

export interface ModelStory {
  eyebrow: string
  title: string
  body: string
  image?: string
  imageAlt?: string
}

export interface ScooterModel {
  slug: string
  name: string
  tagline: string
  description: string
  image: string
  featured: boolean
  highlights: ModelHighlight[]
  specs: ModelSpec[]
  features: string[]
  pricing?: ModelPricing
  colours?: ModelColour[]
  story?: ModelStory[]
  video?: string
  batteryKwh: number
  certifiedRangeKm: number
}

export const scooterModels: ScooterModel[] = [
  {
    slug: 'amptron-volt',
    name: 'Amptron Volt',
    tagline: 'Smart low-speed commuter for dense city routes.',
    description:
      'Agile, cost-efficient city commuter: easy to own, easy to service, built for short urban hops and high-frequency use.',
    image: volt,
    featured: false,
    batteryKwh: 2.0,
    certifiedRangeKm: 80,
    pricing: { exShowroomInr: 79990, placeholder: true },
    colours: [
      { name: 'Glacier White', hex: '#E8EEF4' },
      { name: 'Midnight Navy', hex: '#0A1F44' },
    ],
    story: [
      {
        eyebrow: 'Range',
        title: '80 km certified range',
        body: 'Single-charge city coverage for short urban hops and high-frequency use. A number you can plan a day around.',
      },
      {
        eyebrow: 'Charging',
        title: '3.5 hours on a household socket',
        body: 'Fast turnaround between shifts. Plug in at home. No special charger required to own Volt.',
      },
      {
        eyebrow: 'Category',
        title: '25 km/h low-speed compliance',
        body: 'Built for dense city routes where registration and everyday usefulness matter more than top speed.',
      },
      {
        eyebrow: 'Ownership',
        title: 'Easy to own, easy to service',
        body: 'Digital dashboard, reverse assist, remote lock, and regenerative braking support. Parts and warranty stay behind the machine.',
      },
    ],
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
      'High-torque acceleration, rugged suspension, and practical range, built for mixed-terrain commutes and confident test rides.',
    image: storm,
    featured: true,
    batteryKwh: 2.65,
    certifiedRangeKm: 120,
    pricing: { exShowroomInr: 109990, placeholder: true },
    colours: [
      { name: 'Midnight Navy', hex: '#0A1F44' },
      { name: 'Crimson Red', hex: '#8E2434' },
      { name: 'Forest Green', hex: '#1F5C46' },
      { name: 'Graphite Grey', hex: '#3A3F47' },
    ],
    story: [
      {
        eyebrow: 'Range',
        title: '120 km certified range',
        body: 'Balanced for a full day of mixed-terrain commuting. The Most Popular Amptron, with range you can plan around.',
      },
      {
        eyebrow: 'Speed',
        title: '65 km/h city to suburban',
        body: 'Comfortable travel beyond dense streets, without adding complexity you will not use.',
      },
      {
        eyebrow: 'Ride',
        title: 'Eco, City, and Power modes',
        body: 'Choose the day you are having. Keyless start, a digital TFT console, and regenerative braking are on the machine, not in a brochure.',
      },
      {
        eyebrow: 'Charging',
        title: '4.0 hours to a full pack',
        body: 'Optimized for daytime recharge cycles. Charge at home on a household socket.',
      },
    ],
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
    batteryKwh: 3.4,
    certifiedRangeKm: 150,
    pricing: { exShowroomInr: 134990, placeholder: true },
    colours: [
      { name: 'Graphite Grey', hex: '#3A3F47' },
      { name: 'Midnight Navy', hex: '#0A1F44' },
    ],
    story: [
      {
        eyebrow: 'Range',
        title: '150 km certified range',
        body: 'Extended touring capability for all-day rides. The flagship Amptron, built around range and comfort.',
      },
      {
        eyebrow: 'Speed',
        title: '80 km/h regional mobility',
        body: 'Comfortable highway stretches without turning the scooter into a gadget showcase.',
      },
      {
        eyebrow: 'Comfort',
        title: 'Wide floorboard and pillion kit',
        body: 'Cruise control, reverse mode, and keyless proximity unlock. Space and ride quality first.',
      },
      {
        eyebrow: 'Charging',
        title: '4.5 hours for the high-capacity pack',
        body: 'Charge at home. The 3.4 kWh pack is sized for the day, not for a spec sheet.',
      },
    ],
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

export function specValue(model: ScooterModel, label: string): string {
  const spec = model.specs.find((item) => item.label === label)
  if (spec) return spec.value
  const highlight = model.highlights.find((item) => item.label === label)
  return highlight?.value ?? 'n/a'
}

export const COMPARE_ROWS: Array<{ label: string; specLabel?: string }> = [
  { label: 'Certified Range', specLabel: 'Certified Range' },
  { label: 'Top Speed', specLabel: 'Top Speed' },
  { label: 'Charge Time', specLabel: 'Charge Time' },
  { label: 'Battery Capacity' },
  { label: 'Motor Output' },
  { label: 'Brakes' },
  { label: 'Kerb Weight' },
]
