import Icon from './ui/Icon'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ScooterModel } from '../data/models'

export default function HeroFilm({ model }: { model: ScooterModel }) {
  const player = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!model.video) return
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const syncMotion = () => {
      const connection = (
        navigator as Navigator & { connection?: { saveData?: boolean } }
      ).connection
      if (preference.matches || connection?.saveData) player.current?.pause()
      else void player.current?.play()?.catch(() => {})
    }
    syncMotion()
    preference.addEventListener('change', syncMotion)
    const pauseWhenHidden = () => {
      if (document.hidden) player.current?.pause()
    }
    document.addEventListener('visibilitychange', pauseWhenHidden)
    const observer =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver(([entry]) => {
            if (entry && !entry.isIntersecting) player.current?.pause()
          })
    if (player.current) observer?.observe(player.current)
    return () => {
      preference.removeEventListener('change', syncMotion)
      document.removeEventListener('visibilitychange', pauseWhenHidden)
      observer?.disconnect()
    }
  }, [model.video])

  return (
    <div className="hero-film">
      <div className="hero-film-screen">
        {model.video && !failed ? (
          <video
            ref={player}
            src={model.video}
            poster={model.image || undefined}
            muted
            loop
            playsInline
            controls
            preload="metadata"
            aria-label={`${model.name} introduction film`}
            onError={() => setFailed(true)}
          >
            {model.videoCaptions && (
              <track
                kind="captions"
                src={model.videoCaptions}
                srcLang="en"
                label="English"
                default
              />
            )}
          </video>
        ) : model.image ? (
          <img src={model.image} alt={`${model.name} scooter`} />
        ) : (
          <p>{model.name}</p>
        )}
      </div>
      <div className="hero-film-caption">
        <div>
          <span className="eyebrow">Meet your everyday</span>
          <strong>{model.name}</strong>
        </div>
        <Link className="btn btn-ghost-dark" to={`/models/${model.slug}`}>
          Explore {model.name.replace('Amptron ', '')}
          <Icon name="arrow-right" />
        </Link>
      </div>
      {failed && (
        <output className="hero-film-note">
          The film could not load. Explore the photos and 3D view instead.
        </output>
      )}
    </div>
  )
}
