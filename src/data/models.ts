import { niraMedia } from './products/amptron-nira-media'

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
  points?: string[]
  aside?: string
}

export interface ModelSpecGroup {
  title: string
  labels: string[]
}

export interface ModelAudience {
  title: string
  body: string
}

export interface ModelOmission {
  title: string
  intro: string
  items: string[]
  close: string
}

export interface ModelPromise {
  lines: string[]
  close: string
}

export interface ModelExtra {
  id: string
  eyebrow: string
  title: string
  body: string
  steps?: string[]
}

export interface ScooterModel {
  slug: string
  name: string
  tagline: string
  description: string
  image: string
  featured: boolean
  badge?: string
  highlights: ModelHighlight[]
  specs: ModelSpec[]
  specGroups?: ModelSpecGroup[]
  specHeadline?: string
  specSub?: string
  features: string[]
  omitted?: ModelOmission
  extras?: ModelExtra[]
  audiences?: ModelAudience[]
  promise?: ModelPromise
  pricing?: ModelPricing
  colours?: ModelColour[]
  story?: ModelStory[]
  model3d?: string
  videoCaptions?: string
  video?: string
  batteryKwh: number
  certifiedRangeKm: number
}

export const scooterModels: ScooterModel[] = [
  {
    slug: 'amptron-nira',
    name: 'Amptron NIRA',
    tagline: 'Simple electric mobility for everyday life.',
    description:
      'Simple operation, convenient charging, practical storage, affordable maintenance and components that are straightforward to service. No unnecessary complexity. Just the things you use every day.',
    image: niraMedia.hero,
    featured: true,
    badge: 'Everyday mobility',
    model3d: niraMedia.model3d,
    video: niraMedia.video,
    batteryKwh: 1.54,
    certifiedRangeKm: 55,
    pricing: { exShowroomInr: 69990, placeholder: true },
    colours: [
      { name: 'Pearl Ivory', hex: '#F4EFE6' },
      { name: 'Sage Green', hex: '#7E8B74' },
      { name: 'Matte Grey', hex: '#6A6E72' },
      { name: 'Midnight Black', hex: '#1C1C1C' },
    ],
    story: [
      {
        eyebrow: 'Range',
        title: 'Up to 55 km of practical everyday range',
        body: 'Designed for college runs, shopping, neighbourhood travel, short commutes and everyday family use. NIRA prioritizes honest usable range rather than an oversized brochure number. Ideal for students, homemakers, seniors, short-distance commuters and second-vehicle households.',
        image: niraMedia.studio.side,
        imageAlt: 'Amptron NIRA in Pearl Ivory, side view',
      },
      {
        eyebrow: 'Speed',
        title: '24 km/h for simple local mobility',
        body: 'NIRA is designed around predictable, easy-to-control performance for local roads. Smooth acceleration makes it comfortable for riders who do not need high-speed performance. The production vehicle is intended for the applicable low-speed electric two-wheeler category, subject to final testing-agency verification and authorization.',
        image: niraMedia.studio.frontLeft,
        imageAlt: 'Front-left studio view of Amptron NIRA',
      },
      {
        eyebrow: 'Battery',
        title: 'Take the battery upstairs. Or leave it in the scooter.',
        body: 'NIRA is designed around a removable LFP battery system positioned beneath the floorboard. Apartment resident? Unlock the battery, slide it out and take it upstairs to charge. Have a socket near your parking spot? Leave the battery secured inside and plug the scooter in directly.',
        points: [
          'Remove & charge — Battery slides out from the protected underfloor compartment and can be carried indoors.',
          'Charge on the scooter — Use the weather-protected external charging port without removing the battery.',
        ],
        image: niraMedia.studio.top,
        imageAlt: 'Top view of Amptron NIRA showing the wide underfloor floorboard',
      },
      {
        eyebrow: 'Storage',
        title: 'Battery below. Storage above.',
        body: 'Because the battery is positioned beneath the floorboard, the space underneath the seat remains available for everyday storage. Designed to accommodate one full-face helmet and one compact open-face helmet, without placing the traction battery inside the storage boot. The result is a scooter that remains practical even for apartment users.',
        aside: '1 full-face helmet + 1 compact open-face helmet',
        image: niraMedia.studio.rearThreeQuarter,
        imageAlt:
          'Rear three-quarter view of Amptron NIRA showing the seat and storage area',
      },
      {
        eyebrow: 'Charging',
        title: 'Around 4–4.5 hours to a full charge',
        body: 'Charge from a normal household electrical outlet using the supplied charger. No dedicated charging station required for normal home charging.',
        points: [
          'Inside your apartment',
          'At home',
          'At the office',
          'In a garage',
          'Directly on the scooter',
        ],
        image: niraMedia.studio.frontRight,
        imageAlt: 'Front-right studio view of Amptron NIRA',
      },
      {
        eyebrow: 'Easy to own',
        title: 'Built so normal problems stay normal',
        body: 'A scooter should not become unusable because one small electronic component fails. NIRA is being designed around commonly serviceable components wherever practical. The goal is simple: more mechanics should be able to fix it. More parts should be easy to find.',
        points: [
          'Standard tyres',
          'Conventional brake hardware',
          'Replaceable throttle',
          'Replaceable controller',
          'Standard bearings',
          'Conventional suspension',
          'Replaceable switches',
          'Replaceable lights',
          'Replaceable charger',
          'Accessible wiring and connectors',
        ],
        image: niraMedia.studio.rearLeft,
        imageAlt:
          'Rear-left view of Amptron NIRA showing serviceable chassis components',
      },
    ],
    highlights: [
      {
        label: 'Real-World Range',
        value: '55 km',
        note: 'Built around everyday local travel',
      },
      {
        label: 'Top Speed',
        value: '24 km/h',
        note: 'Easy, predictable city and neighbourhood riding',
      },
      {
        label: 'Charge Time',
        value: '4.0–4.5 hrs',
        note: 'Remove the battery or charge directly on the scooter',
      },
    ],
    specHeadline: 'Practical numbers for everyday riding',
    specSub:
      'Range and weight figures are targets until final Rule 126 / test-agency values are confirmed. Do not treat them as certified on the live site until those results replace the targets.',
    specGroups: [
      {
        title: 'Dimensions',
        labels: [
          'Dimensions (L x W x H)',
          'Wheelbase',
          'Ground Clearance',
          'Kerb Weight',
          'Vehicle Weight Excluding Battery',
          'Payload',
          'Seat Height',
        ],
      },
      {
        title: 'Powertrain',
        labels: [
          'Motor Output',
          'Peak Output',
          'Top Speed',
          'Battery Type',
          'Battery Capacity',
          'Battery Capacity (Ah)',
          'System Voltage',
          'Real-World Range Target',
          'Controlled Test Range Target',
        ],
      },
      {
        title: 'Battery and charging',
        labels: [
          'Battery Position',
          'Battery Format',
          'Charging Methods',
          'Charger Input',
          'Charger Output',
          'Charging Time',
          'Battery Security',
          'Battery Management',
        ],
      },
      {
        title: 'Chassis',
        labels: [
          'Front Suspension',
          'Rear Suspension',
          'Tyres',
          'Front Brake',
          'Rear Brake',
          'Wheels',
          'Frame',
          'Floorboard',
        ],
      },
    ],
    specs: [
      { label: 'Dimensions (L x W x H)', value: '1760 × 680 × 1100 mm' },
      { label: 'Wheelbase', value: '1260 mm' },
      { label: 'Ground Clearance', value: '165 mm' },
      {
        label: 'Kerb Weight',
        value: 'Target approx. 68–72 kg including battery',
      },
      { label: 'Vehicle Weight Excluding Battery', value: 'Target ≤56 kg' },
      { label: 'Payload', value: '140 kg' },
      { label: 'Seat Height', value: 'Approx. 750 mm' },
      { label: 'Motor Output', value: '240W continuous BLDC hub motor' },
      { label: 'Peak Output', value: 'Approx. 500–650W' },
      { label: 'Top Speed', value: '24 km/h' },
      { label: 'Battery Type', value: 'Removable LFP lithium battery' },
      { label: 'Battery Capacity', value: 'Approx. 1.54 kWh' },
      { label: 'Battery Capacity (Ah)', value: '30Ah' },
      { label: 'System Voltage', value: '51.2V nominal / 48V class' },
      { label: 'Range Per Charge', value: '45–55 km real-world target' },
      { label: 'Real-World Range Target', value: '45–55 km' },
      {
        label: 'Controlled Test Range Target',
        value: 'Up to approximately 55–65 km',
      },
      { label: 'Battery Position', value: 'Underfloor, between the wheels' },
      { label: 'Battery Format', value: 'Removable and lockable' },
      {
        label: 'Charging Methods',
        value: 'Battery removed / battery installed',
      },
      { label: 'Charger Input', value: 'AC 180–265V, 50Hz' },
      { label: 'Charger Output', value: '58.4V, 8A' },
      { label: 'Charging Time', value: 'Approx. 4–4.5 hours' },
      { label: 'Charge Time', value: '4.0–4.5 hrs' },
      {
        label: 'Battery Security',
        value: 'Mechanical lock + secondary retention',
      },
      {
        label: 'Battery Management',
        value: 'BMS with voltage, current and temperature protection',
      },
      { label: 'Front Suspension', value: 'Hydraulic telescopic fork' },
      { label: 'Rear Suspension', value: 'Dual hydraulic coil-over shocks' },
      { label: 'Tyres', value: '90/90-10 tubeless' },
      { label: 'Front Brake', value: 'Hydraulic disc' },
      { label: 'Rear Brake', value: 'Mechanical drum' },
      { label: 'Brakes', value: 'Hydraulic disc / mechanical drum' },
      { label: 'Wheels', value: 'Black alloy' },
      { label: 'Frame', value: 'Tubular steel' },
      { label: 'Floorboard', value: 'Wide, flat step-through design' },
    ],
    features: [
      'Simple digital dashboard',
      'Battery percentage / SOC',
      'Speedometer',
      'Odometer',
      'Trip meter',
      'Reverse assist',
      'Side-stand motor cut-off',
      'LED headlamp',
      'LED tail lamp',
      'LED indicators',
      'Daytime running light',
      'USB/mobile charging socket',
      'Mechanical steering lock',
      'Separate battery lock',
      'Remote anti-theft alarm',
      'Regenerative braking support',
      'Under-seat boot light',
      'Center stand',
      'Side stand',
    ],
    omitted: {
      title: 'Less to go wrong',
      intro: 'NIRA does not need technology for technology’s sake. No mandatory:',
      items: [
        'Touchscreen',
        'Mobile app',
        'Cloud connection',
        'Subscription',
        'Navigation',
        'SIM card',
        'Software pairing for basic replacement parts',
      ],
      close:
        'The scooter should continue doing its main job: turn on, move, stop, charge and get you home.',
    },
    extras: [
      {
        id: 'battery-security',
        eyebrow: 'Battery security',
        title: 'Removable doesn’t mean easy to steal',
        body: 'The NIRA battery compartment is designed with multiple physical barriers. When the scooter is parked, the battery remains mechanically secured inside the protected underfloor compartment. The battery should not be removable simply by opening a body panel.',
        steps: [
          'Unlock scooter',
          'Open battery access',
          'Unlock battery retention',
          'Release connector',
          'Remove battery',
        ],
      },
      {
        id: 'apartments',
        eyebrow: 'Designed for apartments',
        title: 'Park downstairs. Charge upstairs.',
        body: 'NIRA is specifically designed for customers who do not have a charging socket next to their parking space. Slide out the battery, carry it indoors and charge from a normal household socket. Or, when charging is available near the scooter, keep the battery installed and charge directly. One scooter. Two charging options.',
      },
    ],
    audiences: [
      {
        title: 'Students',
        body: 'College, tuition and everyday local travel.',
      },
      {
        title: 'Homemakers',
        body: 'Shopping, errands and school runs.',
      },
      {
        title: 'Seniors',
        body: 'Simple controls, approachable speed and easy step-through access.',
      },
      {
        title: 'Families',
        body: 'An affordable second vehicle for everyday short trips.',
      },
      {
        title: 'Tier-2 and Tier-3 towns',
        body: 'Straightforward ownership backed by serviceable components.',
      },
    ],
    promise: {
      lines: ['Simple to ride.', 'Simple to charge.', 'Simple to own.'],
      close: 'Everyday electric mobility without unnecessary complexity.',
    },
  },
  {
    slug: 'amptron-cruise',
    name: 'Amptron Cruise',
    tagline: 'Long-range flagship for all-day rides.',
    description:
      'A comfort-focused long-range scooter for extended commutes, road presence, and confident highway stretches.',
    image: '',
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
  { label: 'Range', specLabel: 'Range Per Charge' },
  { label: 'Top Speed', specLabel: 'Top Speed' },
  { label: 'Charge Time', specLabel: 'Charge Time' },
  { label: 'Battery Capacity' },
  { label: 'Motor Output' },
  { label: 'Brakes' },
  { label: 'Kerb Weight' },
]
