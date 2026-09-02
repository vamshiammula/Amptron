import hqMap from '../assets/images/hq-map.webp'
import mapPin from '../assets/icons/map-pin.svg'
import { HEADQUARTERS } from '../data/headquarters'
import { mapsSearchUrl } from '../lib/maps'

export default function LocationMap() {
  return (
    <figure className="location-map-wrap">
      <a
        className="location-map"
        href={mapsSearchUrl(HEADQUARTERS.mapsQuery)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open Amptron headquarters in Maps"
      >
        <img src={hqMap} alt="" width={960} height={540} loading="lazy" />
        <span className="location-map-pin" aria-hidden="true">
          <img src={mapPin} alt="" width={20} height={20} />
        </span>
        <span className="location-map-cta">Open in Maps</span>
      </a>
      <figcaption className="location-map-credit">
        Map{' '}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
        >
          © OpenStreetMap
        </a>
      </figcaption>
    </figure>
  )
}
