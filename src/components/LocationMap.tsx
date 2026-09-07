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
        <span className="location-address">{HEADQUARTERS.street}</span>
        <span className="location-map-pin" aria-hidden="true">
          <img src={mapPin} alt="" width={20} height={20} />
        </span>
        <span className="location-map-cta">Open in Maps</span>
      </a>
    </figure>
  )
}
