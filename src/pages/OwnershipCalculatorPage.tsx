import { Link, useSearchParams } from 'react-router-dom'
import SavingsCalculator from '../components/SavingsCalculator'
import Seo from '../components/Seo'
import PageHero from '../components/ui/PageHero'

export default function OwnershipCalculatorPage() {
  const [params, setParams] = useSearchParams()
  const modelSlug = params.get('model') ?? undefined

  return (
    <>
      <Seo
        title="Ownership calculator"
        description="Plan Amptron running cost, service, and five-year ownership against a petrol scooter. Indicative figures you can change."
        path="/ownership-calculator"
      />
      <main id="main" className="site-page">
        <PageHero
          eyebrow="Ownership"
          title="Plan the cost of switching"
          lede="Start with fuel. Then routine service. Then a battery repair or replacement if you want to test one. Then the five-year total. Change the figures to match how you ride. Indicative, not a quote."
          narrow
        >
          <Link className="btn btn-ghost-dark" to="/book-test-ride">
            Book a Test Ride
          </Link>
          <Link className="btn btn-ghost-dark" to="/dealers/locate">
            Find a Showroom
          </Link>
        </PageHero>
        <section className="page-section">
          <div className="wrap">
            <SavingsCalculator
              defaultSlug={modelSlug}
              onSlugChange={(slug) => setParams({ model: slug }, { replace: true })}
            />
          </div>
        </section>
      </main>
    </>
  )
}
