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
    aliases: [
      'who is amptron',
      'tell me about amptron',
      'amptron company',
      'who are you',
      'what are you',
      'what this company is about',
      'what is this company about',
      'about amptron',
    ],
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
    aliases: ['purchase scooter', 'order amptron', 'buy online', 'how to purchase'],
    cta: 'buy',
  },
  {
    slug: 'why-buy-amptron',
    question: 'Why should I buy an Amptron scooter?',
    answer:
      'Amptron is built for everyday riders who want dependable electric mobility without unnecessary complexity. Certified range you can plan around, practical specs, and service and spares behind the machine. You should not have to pay for things you do not need.',
    audience: 'rider',
    category: 'buying',
    aliases: [
      'why buy amptron',
      'why should i buy',
      'why do i need to buy',
      'why purchase',
      'why choose amptron',
      'why amptron',
      'why i need to buy',
    ],
    cta: 'test_ride',
  },
  {
    slug: 'why-buy-direct',
    question: 'Why buy Amptron directly?',
    answer:
      'You do not have to buy only from Amptron. The same certified scooter and warranty framework apply whether you buy from us or a partner showroom. Buy direct if you want Amptron to ship to your city. Visit a showroom if you prefer a local handover or test ride first.',
    audience: 'rider',
    category: 'buying',
    aliases: [
      'why buy from you',
      'why have to buy from you',
      'why must i buy from you',
      'why only from amptron',
      'why buy direct',
      'why from amptron only',
    ],
    cta: 'showroom',
  },
  {
    slug: 'test-ride',
    question: 'Can I book a test ride?',
    answer:
      'Yes. Book a test ride with Amptron, or visit a partner showroom. Tell us the model (Volt, Storm, or Cruise) and your city.',
    audience: 'rider',
    category: 'buying',
    aliases: [
      'test drive', 'trial ride', 'book a ride',
      'test ride book karna hai', 'test ride kaise book karein',
      'test drive chahiye', 'test chalana hai', 'test ride available hai',
      'test ride ela book cheyyali',
    ],
    cta: 'test_ride',
  },
  {
    slug: 'find-showroom',
    question: 'Where can I find an Amptron showroom?',
    answer:
      'Use Find a Showroom on the Amptron site to locate a partner showroom. You can also buy Amptron from us directly.',
    audience: 'rider',
    category: 'buying',
    aliases: [
      'dealer near me', 'showroom locator', 'nearest dealer',
      'dealer kahan hai', 'showroom kahan hai', 'nearest showroom',
      'dealer dhundna hai', 'mere paas dealer', 'showroom kaha milega',
      'dealer ela vundadu', 'showroom ela choodalani',
    ],
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
  {
    slug: 'model-pricing',
    question: 'How much do Amptron scooters cost?',
    answer:
      'Starting ex-showroom prices are indicative until booking: Amptron Volt at ₹79,990, Amptron Storm at ₹1,09,990, and Amptron Cruise at ₹1,34,990. EMI estimates are on each model page.',
    audience: 'rider',
    category: 'buying',
    aliases: [
      'price', 'cost', 'how much is storm', 'ex showroom price',
      'price kya hai', 'kitna paisa', 'kitne mein milega', 'scooter ka daam',
      'storm ka price', 'volt ka price', 'cruise ka price',
      'scooter price', 'rate kya hai',
    ],
    cta: 'buy',
  },
  {
    slug: 'emi-financing',
    question: 'Can I buy an Amptron scooter on EMI?',
    answer:
      'Yes. Each model page shows an indicative EMI (9.99% over 36 months, ₹0 down). Lender terms vary at checkout or through a partner showroom.',
    audience: 'rider',
    category: 'buying',
    aliases: [
      'finance', 'monthly payment', 'loan', 'installment',
      'kist mein milega', 'emi kya hai', 'loan pe milega', 'finance karna hai',
      'monthly installment', 'kist kitni hogi',
    ],
    cta: 'buy',
  },
  {
    slug: 'which-model-to-choose',
    question: 'Which Amptron scooter should I choose?',
    answer:
      'Choose by your daily route. Amptron Volt (80 km, 25 km/h) suits dense city hops. Amptron Storm (120 km, 65 km/h) is the Most Popular mix of range and speed. Amptron Cruise (150 km, 80 km/h) is for longer all-day rides. Compare all three on the Models page.',
    audience: 'rider',
    category: 'models',
    aliases: ['which one should I buy', 'best model for me', 'volt or storm', 'choose a scooter', 'help me choose', 'recommend a model', 'which scooter should I choose'],
    cta: 'test_ride',
  },
  {
    slug: 'compare-models',
    question: 'How do I compare Amptron Volt, Storm, and Cruise?',
    answer:
      'Open the Models page or any model detail page and use the compare table. It lines up certified range, speed, charge time, battery, motor, brakes, weight, starting price, and EMI side by side.',
    audience: 'rider',
    category: 'models',
    aliases: ['comparison table', 'spec comparison', 'difference between models'],
    cta: null,
  },
  {
    slug: 'certified-range-meaning',
    question: 'What does certified range mean on Amptron scooters?',
    answer:
      'Certified range is the published per-charge figure on the spec sheet: 80 km for Volt, 120 km for Storm, and 150 km for Cruise. Real-world range depends on ride mode, load, terrain, and temperature. Plan around the certified number.',
    audience: 'rider',
    category: 'specs',
    aliases: ['real world range', 'actual range', 'how far can I go'],
    cta: null,
  },
  {
    slug: 'running-cost-savings',
    question: 'How much does it cost to run an Amptron scooter?',
    answer:
      'Use the Ownership calculator on the Amptron site to compare running cost, service, and five-year ownership against a petrol scooter. Enter your daily kilometres, petrol price, and electricity rate for an indicative result you can adjust.',
    audience: 'rider',
    category: 'buying',
    aliases: ['running cost', 'savings calculator', 'petrol vs electric', 'tco'],
    cta: 'buy',
  },
  {
    slug: 'service-locations',
    question: 'Where can I service my Amptron scooter?',
    answer:
      'Authorized partner showrooms handle sales and service. Use Find a Showroom to locate one by state and city. You can also raise a request through Contact Support on the site.',
    audience: 'rider',
    category: 'ownership',
    aliases: ['service centre', 'workshop', 'repair', 'maintenance'],
    cta: 'showroom',
  },
  {
    slug: 'spare-parts',
    question: 'Are Amptron spare parts available?',
    answer:
      'Yes. Parts supply is part of the product. Partner showrooms stock service kits, and dealers receive spare stocking guidance when they join the network.',
    audience: 'both',
    category: 'ownership',
    aliases: ['spares', 'parts availability', 'replacement parts'],
    cta: 'showroom',
  },
  {
    slug: 'warranty-claim',
    question: 'How do I raise an Amptron warranty claim?',
    answer:
      'Start with the partner showroom where you bought the scooter, or contact Amptron support. Vehicle claims follow your signed sales or dealership policy. Battery claims need charge-cycle and usage diagnostics through an authorized service partner. Details are on the Amptron warranty page.',
    audience: 'both',
    category: 'warranty',
    aliases: ['warranty process', 'claim battery', 'warranty ticket'],
    cta: null,
  },
  {
    slug: 'direct-vs-showroom',
    question: 'Is there a difference between buying direct and from a showroom?',
    answer:
      'No difference in the scooter. Both paths sell the same certified Amptron Volt, Storm, and Cruise, with the same warranty framework. Buy from Amptron directly, or visit a partner showroom if you prefer a local handover and test ride.',
    audience: 'rider',
    category: 'buying',
    aliases: ['buy online vs dealer', 'direct purchase', 'same scooter'],
    cta: 'buy',
  },
  {
    slug: 'direct-delivery',
    question: 'Does Amptron deliver scooters to my city?',
    answer:
      'Amptron ships direct anywhere we can service. When you buy from us, tell us your city during booking. If you prefer a local handover, use Find a Showroom for a partner near you.',
    audience: 'rider',
    category: 'buying',
    aliases: ['home delivery', 'ship to my city', 'delivery available'],
    cta: 'buy',
  },
  {
    slug: 'volt-low-speed',
    question: 'Is Amptron Volt a low-speed scooter?',
    answer:
      'Yes. Amptron Volt is built for the 25 km/h low-speed category, suited to dense city routes where everyday usefulness and simpler ownership matter more than top speed.',
    audience: 'rider',
    category: 'models',
    aliases: ['low speed category', 'volt license', 'volt registration'],
    cta: 'test_ride',
  },
  {
    slug: 'battery-safety',
    question: 'Are Amptron batteries safe?',
    answer:
      'Amptron packs use AIS 156 Phase 2 certified lithium-ion cells with temperature control and a redundant BMS (battery management system). Volt specifies AIS 156 Phase 2 on the spec sheet; Storm and Cruise use smart or advanced BMS-equipped packs at 60V and 72V respectively.',
    audience: 'rider',
    category: 'specs',
    aliases: ['battery safety', 'ais 156', 'bms', 'fire safe'],
    cta: null,
  },
  {
    slug: 'storm-vs-cruise',
    question: 'What is the difference between Amptron Storm and Cruise?',
    answer:
      'Amptron Storm (120 km, 65 km/h, 2.65 kWh) is the Most Popular city and peri-urban scooter. Amptron Cruise (150 km, 80 km/h, 3.4 kWh) is the long-range flagship with dual disc brakes, cruise control, and a wider floorboard. Storm suits mixed city commutes; Cruise suits longer all-day rides.',
    audience: 'rider',
    category: 'models',
    aliases: ['storm or cruise', 'cruise vs storm', 'flagship vs popular'],
    cta: 'test_ride',
  },
  {
    slug: 'dealer-onboarding',
    question: 'What happens after I apply to stock Amptron?',
    answer:
      'Submit your showroom profile through Stock Amptron. An Amptron relationship manager reviews your EV retail footprint and contacts you within 2 business days. Onboarding covers product training, spare stocking, and service escalation before you receive inventory.',
    audience: 'dealer',
    category: 'dealers',
    aliases: ['dealer application timeline', 'how long to onboard', 'after applying'],
    cta: 'stock',
  },
  {
    slug: 'dealer-support',
    question: 'What support do Amptron dealers receive?',
    answer:
      'Dealers get product training, spare stocking guidance, service escalation paths, warranty swap support, parts supply, and a relationship manager as they scale Amptron alongside other EV brands.',
    audience: 'dealer',
    category: 'dealers',
    aliases: ['dealer benefits', 'relationship manager', 'dealer training'],
    cta: 'stock',
  },
  {
    slug: 'contact-support',
    question: 'How do I contact Amptron support?',
    answer:
      'Use Contact Support on the Amptron site, or the support link on the warranty page. For warranty escalation, owners and dealers can raise tickets through the same channel. Dealer applications go through Stock Amptron on the homepage.',
    audience: 'both',
    category: 'company',
    aliases: ['customer support', 'help desk', 'phone number', 'email support'],
    cta: null,
  },
  {
    slug: 'ride-modes',
    question: 'What ride modes does Amptron Storm have?',
    answer:
      'Amptron Storm has Eco, City, and Power ride modes. Switch between them for efficiency or acceleration depending on your route.',
    audience: 'rider',
    category: 'features',
    aliases: ['eco city power', 'storm modes', 'riding modes'],
    cta: 'test_ride',
  },
  {
    slug: 'regenerative-braking',
    question: 'Does Amptron have regenerative braking?',
    answer:
      'Yes. Regenerative braking is specified on Amptron Volt, Storm, and Cruise. It sends kinetic energy back to the battery during deceleration.',
    audience: 'rider',
    category: 'features',
    aliases: ['regen braking', 'energy recovery', 'regen'],
    cta: null,
  },
  {
    slug: 'volt-brakes',
    question: 'What brakes does Amptron Volt use?',
    answer: 'Amptron Volt uses a front disc and rear drum with CBS.',
    audience: 'rider',
    category: 'specs',
    aliases: ['volt braking', 'volt cbs'],
    cta: null,
  },
  {
    slug: 'cruise-brakes',
    question: 'What brakes does Amptron Cruise use?',
    answer: 'Amptron Cruise uses dual disc brakes with CBS.',
    audience: 'rider',
    category: 'specs',
    aliases: ['cruise braking', 'cruise cbs', 'dual disc'],
    cta: null,
  },
  {
    slug: 'colours-available',
    question: 'What colours are available for Amptron scooters?',
    answer:
      'Colours vary by model. Amptron Volt comes in Glacier White and Midnight Navy. Storm adds Crimson Red and Forest Green plus Graphite Grey. Cruise is available in Graphite Grey and Midnight Navy. See each model page for the current palette.',
    audience: 'rider',
    category: 'models',
    aliases: ['color options', 'paint colours', 'available colours'],
    cta: 'buy',
  },

  // -------------------------------------------------------------------------
  // Model-less summary FAQs
  // Catch "what is the range?" / "kitna range hai" without a three-way tie.
  // -------------------------------------------------------------------------
  {
    slug: 'range-all-models',
    question: 'What is the range of Amptron scooters?',
    answer:
      'Certified range by model: Amptron Volt 80 km, Amptron Storm 120 km (Most Popular), Amptron Cruise 150 km. All figures are per charge on a household socket.',
    audience: 'rider',
    category: 'specs',
    aliases: [
      'how far can it go', 'range per charge', 'kitna range', 'kitna range hai',
      'range kya hai', 'ek charge mein kitna', 'ek charge mein kitne km',
      'ela untundi range', 'scooter range', 'overall range',
    ],
    cta: null,
  },
  {
    slug: 'speed-all-models',
    question: 'What is the top speed of Amptron scooters?',
    answer:
      'Top speed by model: Amptron Volt 25 km/h (low-speed category), Amptron Storm 65 km/h, Amptron Cruise 80 km/h.',
    audience: 'rider',
    category: 'specs',
    aliases: [
      'maximum speed', 'how fast', 'top speed', 'kitni speed', 'speed kya hai',
      'top speed kitni hai', 'fast kitna hai', 'max speed',
    ],
    cta: null,
  },
  {
    slug: 'charge-time-all-models',
    question: 'How long do Amptron scooters take to charge?',
    answer:
      'Charge time by model: Amptron Volt 3.5 hours, Amptron Storm 4.0 hours, Amptron Cruise 4.5 hours. All models charge on a standard AC 180-265V household socket.',
    audience: 'rider',
    category: 'charging',
    aliases: [
      'charging time', 'how long to charge', 'kitni der', 'kitna time lagta hai',
      'charge karne mein kitna time', 'kab tak charge hoga', 'charge duration',
      'charger hours', 'full charge kitne ghante',
    ],
    cta: null,
  },
  {
    slug: 'battery-all-models',
    question: 'What battery do Amptron scooters use?',
    answer:
      'Battery by model: Volt uses a 2.0 kWh lithium-ion pack (AIS 156 Phase 2, 60V, 1500W BLDC). Storm uses 2.65 kWh with smart BMS (60V, 2500W BLDC). Cruise uses 3.4 kWh advanced lithium-ion (72V, 3200W BLDC). All packs have temperature control and a BMS.',
    audience: 'rider',
    category: 'specs',
    aliases: [
      'battery capacity', 'battery type', 'kwh', 'battery size', 'pack size',
      'battery kya hai', 'battery kitne ki', 'lithium battery',
    ],
    cta: null,
  },
  {
    slug: 'payload-all-models',
    question: 'What is the payload capacity of Amptron scooters?',
    answer:
      'Payload by model: Amptron Volt 145 kg (kerb weight 89 kg), Amptron Storm 150 kg (kerb weight 95 kg), Amptron Cruise 155 kg (kerb weight 102 kg).',
    audience: 'rider',
    category: 'specs',
    aliases: [
      'weight capacity', 'carrying capacity', 'load capacity', 'max load',
      'kitna weight carry', 'kitna bojh', 'payload kya hai',
    ],
    cta: null,
  },
  {
    slug: 'brakes-all-models',
    question: 'What brakes do Amptron scooters use?',
    answer:
      'Brake setup by model: Amptron Volt front disc and rear drum with CBS. Amptron Storm disc plus drum with CBS. Amptron Cruise dual disc with CBS.',
    audience: 'rider',
    category: 'specs',
    aliases: [
      'braking system', 'what brakes', 'cbs brakes', 'disc brakes', 'drum brakes',
      'brake type', 'brakes kya hain',
    ],
    cta: null,
  },
]
