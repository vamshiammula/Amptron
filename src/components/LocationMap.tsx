import Icon from './ui/Icon'
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
        <span className="location-map-pin">
          <Icon name="map-pin" />
        </span>
        <span className="location-map-copy">
          <strong>Find our headquarters</strong>
          <span>Open in Maps</span>
        </span>
        <Icon name="arrow-up-right" />
      </a>
    </figure>
  )
}
