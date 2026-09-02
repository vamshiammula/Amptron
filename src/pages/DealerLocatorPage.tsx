import { useEffect, useMemo, useState } from 'react'
import Seo from '../components/Seo'
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
      <main id="main" className="content-page">
        <section className="content-hero">
          <p className="content-eyebrow">Dealer Network</p>
          <h1>Find an Amptron Showroom</h1>
          <p>
            Search by state and city for authorized sales and service partners. You
            can also buy from Amptron directly.
          </p>
        </section>

        <section className="locator-filters">
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
        </section>

        {loading ? <p className="content-note">Loading dealer network...</p> : null}
        {error ? <p className="content-note content-error">{error}</p> : null}

        <section className="dealer-results">
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
          {!loading && !error && filteredDealers.length === 0 ? (
            <p className="content-note">
              No showrooms found for this filter.{' '}
              <a href="/#buy">Buy from Amptron directly</a>, or contact us to find a
              partner in your region.
            </p>
          ) : null}
        </section>
      </main>
    </>
  )
}
