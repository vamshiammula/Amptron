export interface SeedFaq {
  slug: string
  question: string
  answer: string
  audience: 'rider' | 'dealer' | 'both'
  category: string
  aliases: string[]
  cta: 'buy' | 'test_ride' | 'showroom' | 'stock' | null
}

/**
 * Spec-true test corpus from published Amptron model data.
 * Admins can edit or replace these rows after seeding.
 */
export const FAQ_SEED: readonly SeedFaq[] = [
  {
    slug: 'what-is-amptron',
    question: 'What is Amptron?',
    answer:
      'Amptron Manufacturing Pvt. Ltd. builds certified, precision-assembled electric scooters. You can buy Amptron from us or from a partner showroom. Dealers stock Amptron next to the EV brands they already sell.',
    audience: 'both',
    category: 'company',
    aliases: ['who is amptron', 'tell me about amptron', 'amptron company'],
    cta: 'buy',
  },
  {
    slug: 'which-models',
    question: 'Which Amptron models are available?',
    answer:
      'Amptron currently offers three scooters: Amptron Volt, Amptron Storm (Most Popular), and Amptron Cruise.',
    audience: 'both',
    category: 'models',
    aliases: ['model lineup', 'scooter range', 'what scooters do you sell'],
    cta: 'buy',
  },
  {
    slug: 'volt-overview',
    question: 'What is Amptron Volt?',
    answer:
      'Amptron Volt is a smart low-speed commuter for dense city routes. It is built for short urban hops and high-frequency use, with an 80 km certified range, 25 km/h top speed, and a 3.5 hour charge time.',
    audience: 'rider',
    category: 'models',
    aliases: ['tell me about volt', 'volt scooter', 'city commuter scooter'],
    cta: 'test_ride',
  },
  {
    slug: 'storm-overview',
    question: 'What is Amptron Storm?',
    answer:
      'Amptron Storm is the Most Popular model. It is a performance-first city and peri-urban scooter with a 120 km certified range, 65 km/h top speed, and a 4.0 hour charge time.',
    audience: 'rider',
    category: 'models',
    aliases: ['most popular scooter', 'storm scooter', 'tell me about storm'],
    cta: 'test_ride',
  },
  {
    slug: 'cruise-overview',
    question: 'What is Amptron Cruise?',
    answer:
      'Amptron Cruise is the long-range flagship for all-day rides. It has a 150 km certified range, 80 km/h top speed, and a 4.5 hour charge time.',
    audience: 'rider',
    category: 'models',
    aliases: ['flagship scooter', 'cruise scooter', 'long range scooter'],
    cta: 'test_ride',
  },
  {
    slug: 'volt-range',
    question: 'What is the certified range of Amptron Volt?',
    answer: 'Amptron Volt has a certified range of 80 km per charge.',
    audience: 'rider',
    category: 'specs',
    aliases: ['volt km', 'how far does volt go', 'volt range per charge'],
    cta: null,
  },
  {
    slug: 'storm-range',
    question: 'What is the certified range of Amptron Storm?',
    answer: 'Amptron Storm has a certified range of 120 km per charge.',
    audience: 'rider',
    category: 'specs',
    aliases: ['storm km', 'how far does storm go', 'storm range per charge'],
    cta: null,
  },
  {
    slug: 'cruise-range',
    question: 'What is the certified range of Amptron Cruise?',
    answer: 'Amptron Cruise has a certified range of 150 km per charge.',
    audience: 'rider',
    category: 'specs',
    aliases: ['cruise km', 'how far does cruise go', 'cruise range per charge'],
    cta: null,
  },
  {
    slug: 'volt-speed',
    question: 'What is the top speed of Amptron Volt?',
    answer: 'Amptron Volt has a top speed of 25 km/h, in the low-speed category.',
    audience: 'rider',
    category: 'specs',
    aliases: ['volt km/h', 'volt maximum speed'],
    cta: null,
  },
  {
    slug: 'storm-speed',
    question: 'What is the top speed of Amptron Storm?',
    answer: 'Amptron Storm has a top speed of 65 km/h.',
    audience: 'rider',
    category: 'specs',
    aliases: ['storm km/h', 'storm maximum speed'],
    cta: null,
  },
  {
    slug: 'cruise-speed',
    question: 'What is the top speed of Amptron Cruise?',
    answer: 'Amptron Cruise has a top speed of 80 km/h.',
    audience: 'rider',
    category: 'specs',
    aliases: ['cruise km/h', 'cruise maximum speed'],
    cta: null,
  },
  {
    slug: 'volt-charge',
    question: 'How long does Amptron Volt take to charge?',
    answer: 'Amptron Volt charges in 3.5 hours.',
    audience: 'rider',
    category: 'charging',
    aliases: ['volt charging time', 'volt charger hours'],
    cta: null,
  },
  {
    slug: 'storm-charge',
    question: 'How long does Amptron Storm take to charge?',
    answer: 'Amptron Storm charges in 4.0 hours.',
    audience: 'rider',
    category: 'charging',
    aliases: ['storm charging time', 'storm charger hours'],
    cta: null,
  },
  {
    slug: 'cruise-charge',
    question: 'How long does Amptron Cruise take to charge?',
    answer: 'Amptron Cruise charges in 4.5 hours.',
    audience: 'rider',
    category: 'charging',
    aliases: ['cruise charging time', 'cruise charger hours'],
    cta: null,
  },
  {
    slug: 'volt-battery',
    question: 'What battery does Amptron Volt use?',
    answer:
      'Amptron Volt uses a 2.0 kWh lithium-ion pack, AIS 156 Phase 2, at 60V, with a 1500W BLDC hub motor.',
    audience: 'rider',
    category: 'specs',
    aliases: ['volt battery capacity', 'volt motor'],
    cta: null,
  },
  {
    slug: 'storm-battery',
    question: 'What battery does Amptron Storm use?',
    answer:
      'Amptron Storm uses a 2.65 kWh lithium-ion pack with smart BMS, at 60V, with a 2500W BLDC hub motor.',
    audience: 'rider',
    category: 'specs',
    aliases: ['storm battery capacity', 'storm motor'],
    cta: null,
  },
  {
    slug: 'cruise-battery',
    question: 'What battery does Amptron Cruise use?',
    answer:
      'Amptron Cruise uses a 3.4 kWh advanced lithium-ion pack at 72V, with a 3200W BLDC hub motor.',
    audience: 'rider',
    category: 'specs',
    aliases: ['cruise battery capacity', 'cruise motor'],
    cta: null,
  },
  {
    slug: 'volt-payload',
    question: 'What is the payload of Amptron Volt?',
    answer: 'Amptron Volt has a 145 kg payload and an 89 kg kerb weight.',
    audience: 'rider',
    category: 'specs',
    aliases: ['volt weight', 'volt carrying capacity'],
    cta: null,
  },
  {
    slug: 'storm-payload',
    question: 'What is the payload of Amptron Storm?',
    answer: 'Amptron Storm has a 150 kg payload and a 95 kg kerb weight.',
    audience: 'rider',
    category: 'specs',
    aliases: ['storm weight', 'storm carrying capacity'],
    cta: null,
  },
  {
    slug: 'cruise-payload',
    question: 'What is the payload of Amptron Cruise?',
    answer: 'Amptron Cruise has a 155 kg payload and a 102 kg kerb weight.',
    audience: 'rider',
    category: 'specs',
    aliases: ['cruise weight', 'cruise carrying capacity'],
    cta: null,
  },
  {
    slug: 'how-to-buy',
    question: 'How do I buy an Amptron scooter?',
    answer:
      'Buy Amptron from us, or find a partner showroom near you. Both paths sell the same certified scooters.',
    audience: 'rider',
    category: 'buying',
    aliases: ['purchase scooter', 'order amptron', 'buy online'],
    cta: 'buy',
  },
  {
    slug: 'test-ride',
    question: 'Can I book a test ride?',
    answer:
      'Yes. Book a test ride with Amptron, or visit a partner showroom. Tell us the model (Volt, Storm, or Cruise) and your city.',
    audience: 'rider',
    category: 'buying',
    aliases: ['test drive', 'trial ride', 'book a ride'],
    cta: 'test_ride',
  },
  {
    slug: 'find-showroom',
    question: 'Where can I find an Amptron showroom?',
    answer:
      'Use Find a Showroom on the Amptron site to locate a partner showroom. You can also buy Amptron from us directly.',
    audience: 'rider',
    category: 'buying',
    aliases: ['dealer near me', 'showroom locator', 'nearest dealer'],
    cta: 'showroom',
  },
  {
    slug: 'stock-amptron',
    question: 'How can a dealer stock Amptron?',
    answer:
      'Stock Amptron next to the EV brands you already sell. Amptron is not an exclusive-territory franchise. Submit your showroom profile through Stock Amptron on the website.',
    audience: 'dealer',
    category: 'dealers',
    aliases: ['become a dealer', 'franchise', 'dealership application'],
    cta: 'stock',
  },
  {
    slug: 'exclusive-dealer',
    question: 'Do I need an exclusive Amptron dealership?',
    answer:
      'No. Dealers stock Amptron as a multi-brand line. Amptron does not require exclusive territory, and riders can still buy from Amptron directly.',
    audience: 'dealer',
    category: 'dealers',
    aliases: ['exclusive franchise', 'only amptron dealers', 'cut out dealers'],
    cta: 'stock',
  },
  {
    slug: 'warranty',
    question: 'What is the Amptron warranty?',
    answer:
      'Vehicle components are covered as per the signed sales or dealership policy and model-specific terms. Battery claims need charge-cycle and usage diagnostics through authorized service partners. Details are on the Amptron warranty page.',
    audience: 'both',
    category: 'warranty',
    aliases: ['battery warranty', 'service warranty', 'claims'],
    cta: null,
  },
  {
    slug: 'storm-features',
    question: 'What features does Amptron Storm include?',
    answer:
      'Amptron Storm includes keyless start, Eco/City/Power ride modes, a digital TFT console, anti-theft alarm, regenerative braking, USB charging, and a navigation mount.',
    audience: 'rider',
    category: 'features',
    aliases: ['storm equipment', 'storm accessories'],
    cta: 'test_ride',
  },
  {
    slug: 'volt-features',
    question: 'What features does Amptron Volt include?',
    answer:
      'Amptron Volt includes a digital dashboard, reverse assist, remote lock/unlock, a mobile charging socket, a side-stand sensor, and regenerative braking support.',
    audience: 'rider',
    category: 'features',
    aliases: ['volt equipment', 'volt accessories'],
    cta: 'test_ride',
  },
  {
    slug: 'cruise-features',
    question: 'What features does Amptron Cruise include?',
    answer:
      'Amptron Cruise includes cruise control, a smart dashboard with telemetry, reverse mode, keyless proximity unlock, a wide floorboard and pillion comfort kit, and remote diagnostics readiness.',
    audience: 'rider',
    category: 'features',
    aliases: ['cruise equipment', 'cruise accessories'],
    cta: 'test_ride',
  },
  {
    slug: 'storm-brakes',
    question: 'What brakes does Amptron Storm use?',
    answer: 'Amptron Storm uses disc plus drum brakes with CBS.',
    audience: 'rider',
    category: 'specs',
    aliases: ['storm braking', 'storm cbs'],
    cta: null,
  },
  {
    slug: 'most-popular',
    question: 'Which Amptron scooter is most popular?',
    answer:
      'Amptron Storm is the Most Popular model: 120 km certified range and 65 km/h, built for mixed-terrain city and peri-urban commutes.',
    audience: 'rider',
    category: 'models',
    aliases: ['best selling', 'recommended model', 'which scooter should I buy'],
    cta: 'test_ride',
  },
  {
    slug: 'home-charging',
    question: 'Can I charge Amptron scooters at home?',
    answer:
      'Yes. Amptron chargers accept AC 180–265V, 50Hz household input. Charge times are 3.5 hours for Volt, 4.0 hours for Storm, and 4.5 hours for Cruise.',
    audience: 'rider',
    category: 'charging',
    aliases: ['household charging', 'plug in at home', 'charger voltage'],
    cta: null,
  },
]
