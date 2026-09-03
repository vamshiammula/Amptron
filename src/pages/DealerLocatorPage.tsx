import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Seo from '../components/Seo'
import PageHero from '../components/ui/PageHero'
import { mapsSearchUrl } from '../lib/maps'

interface DealerRecord {
  id: string
  name: string
  city: string
  state: string
  area: string
  phone: string
}

export default function DealerLocatorPage() {
  const [dealers, setDealers] = useState<DealerRecord[]>([])
  const [stateFilter, setStateFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/dealers')
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not load dealer network.')
        const payload = (await response.json()) as { dealers?: DealerRecord[] }
        if (!active) return
        setDealers(payload.dealers ?? [])
      })
      .catch((fetchError) => {
        if (!active) return
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Could not load dealer network.',
        )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const states = useMemo(
    () => Array.from(new Set(dealers.map((dealer) => dealer.state))).toSorted(),
    [dealers],
  )

  const cities = useMemo(() => {
    const filtered = stateFilter
      ? dealers.filter((dealer) => dealer.state === stateFilter)
      : dealers
    return Array.from(new Set(filtered.map((dealer) => dealer.city))).toSorted()
  }, [dealers, stateFilter])

  const filteredDealers = useMemo(() => {
    return dealers.filter((dealer) => {
      const byState = !stateFilter || dealer.state === stateFilter
      const byCity = !cityFilter || dealer.city === cityFilter
      return byState && byCity
    })
  }, [dealers, stateFilter, cityFilter])

  return (
    <>
      <Seo
        title="Amptron Dealer Locator"
        description="Find an Amptron showroom, or buy from us directly. Search partners by state, city, and area."
        path="/dealers/locate"
      />
      <main id="main" className="site-page">
        <PageHero
          eyebrow="Dealer network"
          title="Find an Amptron Showroom"
          lede="Search by state and city for authorized sales and service partners. Prefer to skip the trip? You can also buy from Amptron directly."
        >
          <a className="btn btn-primary" href="/#buy">
            Buy Amptron
          </a>
          <Link className="btn btn-ghost-dark" to="/book-test-ride">
            Book a Test Ride
          </Link>
        </PageHero>

        <section className="page-section page-section--fog">
          <div className="wrap">
            <div className="locator-panel">
              <div className="locator-filters">
                <label>
                  State
                  <select
                    value={stateFilter}
                    onChange={(event) => {
                      setStateFilter(event.target.value)
                      setCityFilter('')
                    }}
                  >
                    <option value="">All States</option>
                    {states.map((state) => (
                      <option value={state} key={state}>
                        {state}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  City
                  <select
                    value={cityFilter}
                    onChange={(event) => setCityFilter(event.target.value)}
                  >
                    <option value="">All Cities</option>
                    {cities.map((city) => (
                      <option value={city} key={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="content-note" aria-live="polite">
                {loading
                  ? 'Loading dealer network...'
                  : error
                    ? error
                    : `${filteredDealers.length} showroom${filteredDealers.length === 1 ? '' : 's'}${stateFilter ? ` in ${cityFilter || stateFilter}` : ' across India'}`}
              </p>
            </div>
          </div>
        </section>

        <section className="page-section">
          <div className="wrap">
            {!loading && !error && filteredDealers.length === 0 ? (
              <div className="locator-empty">
                <h2>No showrooms for this filter yet.</h2>
                <p>
                  Amptron ships direct anywhere we can service. Buy from us, or tell
                  us your city and we will point you to the nearest partner.
                </p>
                <div className="model-actions">
                  <a className="btn btn-primary" href="/#buy">
                    Buy Amptron
                  </a>
                  <a className="btn btn-ghost-dark" href="/#contact">
                    Contact Amptron
                  </a>
                </div>
              </div>
            ) : (
              <div className="dealer-results">
                {filteredDealers.map((dealer) => (
                  <article className="dealer-card" key={dealer.id}>
                    <h2>{dealer.name}</h2>
                    <p>
                      {dealer.area}, {dealer.city}, {dealer.state}
                    </p>
                    <div className="dealer-card-actions">
                      <a href={`tel:${dealer.phone}`}>{dealer.phone}</a>
                      <a
                        href={mapsSearchUrl(
                          `${dealer.name}, ${dealer.area}, ${dealer.city}, ${dealer.state}`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open in Maps
                      </a>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="cta-band">
          <div className="wrap cta-band-inner">
            <div>
              <h2>Run an EV showroom? Stock Amptron.</h2>
              <p>
                No exclusive dealership required. Put Amptron next to the brands you
                already sell, with spares and a relationship manager behind it.
              </p>
            </div>
            <div className="cta-band-actions">
              <a className="btn btn-primary" href="/#contact">
                Stock Amptron
              </a>
              <Link className="btn btn-ghost" to="/portal/login">
                Dealer Login
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
