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
        description="Compare Amptron with a petrol scooter or another electric scooter using your own figures for running costs and five-year ownership."
        path="/ownership-calculator"
      />
      <main id="main" className="site-page">
        <PageHero
          eyebrow="Ownership"
          title="Plan the cost of switching"
          lede="Compare Amptron with a petrol scooter or another electric scooter. See the upfront price, running costs and five-year total using your own figures. This is an estimate, not a quote."
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
