import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { ModelViewerElement } from '../types/model-viewer'
import type { ScooterModel } from '../data/models'
import MediaPlaceholder from './MediaPlaceholder'
import { niraPhotos } from '../data/products/amptron-nira-media'

export default function ScooterStage({ model }: { model: ScooterModel }) {
  const photos = model.image
    ? model.slug === 'amptron-nira'
      ? niraPhotos
      : [{ src: model.image, thumbnail: model.image, label: 'Overview' }]
    : []
  const [failed, setFailed] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const photo = photos[photoIndex % (photos.length || 1)]
  const selectPhoto = (index: number) => {
    setPhotoIndex((index + photos.length) % photos.length)
    setFailed(false)
  }
  const navigatePhotos = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault()
      selectPhoto(photoIndex + (event.key === 'ArrowRight' ? 1 : -1))
    }
  }
  const [mode, setMode] = useState<'3d' | 'photo' | 'video'>(
    model.image ? 'photo' : '3d',
  )
  const [ready, setReady] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const viewer = useRef<ModelViewerElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!model.model3d || mode !== '3d') return
    let active = true
    import('@google/model-viewer')
      .then(() => {
        if (active) setReady(true)
      })
      .catch(() => {
        if (active) setFailed(true)
      })
    return () => {
      active = false
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- Retry must rerun a failed import even when the URL is unchanged.
  }, [model.model3d, mode, attempt])
  useLayoutEffect(() => {
    const node = viewer.current
    if (!node || !ready || !model.model3d || mode !== '3d') return
    const deadline = window.setTimeout(() => setFailed(true), 15000)
    const load = () => {
      window.clearTimeout(deadline)
      setLoaded(true)
      setFailed(false)
    }
    const error = () => {
      window.clearTimeout(deadline)
      setFailed(true)
    }
    node.addEventListener('load', load)
    node.addEventListener('error', error)
    return () => {
      window.clearTimeout(deadline)
      node.removeEventListener('load', load)
      node.removeEventListener('error', error)
    }
    // oxlint-disable-next-line react/exhaustive-effect-dependencies -- Retry replaces the keyed viewer; attach listeners to its new element.
  }, [ready, model.model3d, mode, attempt])
  const changeMode = (value: typeof mode) => {
    setMode(value)
    setLoaded(false)
    setFailed(false)
  }
  return (
    <div className="scooter-stage" ref={frame}>
      <div className="stage-header">
        <span>{model.name}</span>
        <span className="stage-label">Product studio</span>
      </div>
      <div className="stage-surface">
        {mode === '3d' ? (
          model.model3d ? (
            <>
              {ready && (
                <model-viewer
                  key={`${model.model3d}-${attempt}`}
                  ref={viewer}
                  src={model.model3d}
                  alt={`Interactive 3D view of ${model.name}`}
                  camera-controls
                  touch-action="pan-y"
                  shadow-intensity="0"
                  interaction-prompt="none"
                  camera-orbit="35deg 75deg 105%"
                  min-camera-orbit="auto auto 30%"
                  max-camera-orbit="auto auto 200%"
                  exposure="1"
                  loading="eager"
                />
              )}

              {!loaded && !failed && (
                <output className="stage-message">Loading 3D view…</output>
              )}
              {failed && (
                <div className="stage-message" role="alert">
                  <p>The 3D view could not load.</p>
                  <button
                    className="btn btn-ghost-dark"
                    onClick={() => {
                      setFailed(false)
                      setLoaded(false)
                      setAttempt((n) => n + 1)
                    }}
                  >
                    Try again
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="stage-empty">
              <svg
                className="stage-monogram"
                aria-hidden="true"
                viewBox="128 367 264 181"
              >
                <path d="M239.15 368.32C258.158 368.337 279.476 367.869 298.294 368.507C315.739 402.971 333.484 437.282 351.524 471.438C363.351 493.694 379.898 523.847 390.452 546.485L332.706 546.506C329.226 539.384 320.8 523.127 318.301 516.463L231.019 516.404L251.718 474.863C266.82 474.843 283.864 475.339 298.709 474.833C288.499 455.654 278 433.96 267.281 415.406C242.525 459.557 215.74 502.301 191.116 546.171C188.209 547.023 131.991 547.052 129.842 546.296L129.927 545.167C133.121 541.316 139.399 530.391 142.219 525.744L163.64 490.612C184.858 456.65 208.667 419.263 228.655 384.984L239.15 368.32Z" />
              </svg>
              <p className="eyebrow">A closer look, coming soon</p>
              <h2>{model.name}</h2>
              <p>
                The interactive 3D view will be available here.
                <br />
                Explore the specifications below in the meantime.
              </p>
            </div>
          )
        ) : mode === 'photo' ? (
          <img
            key={photo?.src}
            src={photo?.src}
            alt={`${model.name} — ${photo?.label}`}
            onError={() => setFailed(true)}
          />
        ) : (
          <video
            src={model.video}
            controls
            playsInline
            preload="metadata"
            aria-label={`${model.name} product video`}
            onError={() => setFailed(true)}
          >
            <track
              kind="captions"
              src={model.videoCaptions}
              label="English captions"
              srcLang="en"
              default
            />
          </video>
        )}
        {failed && mode !== '3d' && <MediaPlaceholder label={model.name} />}
      </div>
      {mode === 'photo' && photos.length > 0 && (
        <section
          className="stage-gallery"
          aria-label={`${model.name} photo gallery`}
        >
          <div className="stage-photo-navigation">
            <button
              type="button"
              onKeyDown={navigatePhotos}
              onClick={() => selectPhoto(photoIndex - 1)}
              disabled={photos.length < 2}
              aria-label="Previous photo"
            >
              ← Previous
            </button>
            <span aria-live="polite" aria-atomic="true">
              {photoIndex + 1} / {photos.length} · {photo?.label}
            </span>
            <button
              type="button"
              onKeyDown={navigatePhotos}
              onClick={() => selectPhoto(photoIndex + 1)}
              disabled={photos.length < 2}
              aria-label="Next photo"
            >
              Next →
            </button>
          </div>
          <div className="stage-thumbnails" aria-label="Choose a photo">
            {photos.map((item, index) => (
              <button
                type="button"
                key={item.src}
                aria-label={`View ${item.label.toLowerCase()}`}
                aria-pressed={photoIndex === index}
                onKeyDown={navigatePhotos}
                onClick={() => selectPhoto(index)}
              >
                <img
                  src={item.thumbnail}
                  alt=""
                  width={76}
                  height={58}
                  loading="lazy"
                  decoding="async"
                />
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}
      <div className="stage-toolbar" aria-label="Product media">
        <div className="stage-modes">
          <button
            type="button"
            aria-pressed={mode === '3d'}
            onClick={() => changeMode('3d')}
          >
            3D view
          </button>
          <button
            type="button"
            disabled={!model.image}
            aria-pressed={mode === 'photo'}
            onClick={() => changeMode('photo')}
          >
            Photos{!model.image ? ' · soon' : ''}
          </button>
          <button
            type="button"
            disabled={!model.video}
            aria-pressed={mode === 'video'}
            onClick={() => changeMode('video')}
          >
            Film{!model.video ? ' · soon' : ''}
          </button>
        </div>
        <div className="stage-controls">
          <button
            type="button"
            disabled={!loaded || mode !== '3d'}
            aria-label="Reset 3D view"
            onClick={() => {
              if (viewer.current) viewer.current.cameraOrbit = '35deg 75deg 105%'
            }}
          >
            Reset
          </button>
          <button
            type="button"
            disabled={!loaded || mode !== '3d'}
            aria-label="Zoom in"
            onClick={() => viewer.current?.zoom(1)}
          >
            +
          </button>
          <button
            type="button"
            disabled={!loaded || mode !== '3d'}
            aria-label="Zoom out"
            onClick={() => viewer.current?.zoom(-1)}
          >
            −
          </button>
          <button
            type="button"
            disabled={!loaded || mode !== '3d'}
            aria-label="Fullscreen 3D view"
            onClick={() => {
              void frame.current?.requestFullscreen?.().catch(() => setFailed(true))
            }}
          >
            Expand
          </button>
        </div>
      </div>
      <p className="stage-help">
        {loaded && mode === '3d'
          ? 'Drag to rotate. Scroll or pinch to zoom. Arrow keys rotate the view.'
          : mode === 'photo'
            ? 'Use Previous and Next, choose a thumbnail, or use arrow keys on the gallery controls.'
            : mode === 'video'
              ? 'Use the player controls to play, pause or expand the film.'
              : 'Specifications remain available while product media is being prepared.'}
      </p>
    </div>
  )
}
