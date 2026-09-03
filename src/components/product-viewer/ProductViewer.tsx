import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent } from 'react'
import type { ScooterModel } from '../../data/models'
import type {
  ProductExperience,
  ProductHotspot,
  ProductViewerConfig,
  ProductViewerMode,
} from '../../data/products/types'
import {
  enabledExperiences,
  resolveDisplayedAsset,
  wrapIndex,
} from '../../lib/productViewerMath'
import FeaturePanel from './FeaturePanel'
import FullscreenViewer from './FullscreenViewer'
import ModeSelector from './ModeSelector'
import ProductViewerRenderer from './ProductViewerRenderer'
import ViewerControls from './ViewerControls'
import { visibleActions } from './viewerActions'
import ZoomControls from './ZoomControls'
import { useImagePreloader } from './useImagePreloader'
import { useViewerZoom } from './useViewerZoom'
import './ProductViewer.css'

function mediaMatches(query: string): boolean {
  return (
    typeof window !== 'undefined' && Boolean(window.matchMedia?.(query).matches)
  )
}

function humanize(key: string): string {
  const text = key.replaceAll('-', ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function resolveExperiences(config: ProductViewerConfig): ProductExperience[] {
  const exterior = config.experiences.find((item) => item.id === 'exterior')
  const mapped = config.experiences.map((experience) => {
    if (
      experience.id === 'features' &&
      experience.enabled &&
      experience.assets.length === 0 &&
      exterior
    ) {
      return {
        ...experience,
        assets: exterior.assets,
        startKey: exterior.startKey,
      }
    }
    return experience
  })
  return enabledExperiences(mapped)
}

export default function ProductViewer({
  model,
  config,
  colorwayId: controlledColorwayId,
  onColorwayChange,
  embedded = false,
}: Readonly<{
  model: ScooterModel
  config: ProductViewerConfig
  /** Controlled colorway; when set, the page owns the colour picker. */
  colorwayId?: string
  onColorwayChange?: (id: string) => void
  /** Hide the masthead when the surrounding page already shows name and colours. */
  embedded?: boolean
}>) {
  const modes = useMemo(() => resolveExperiences(config), [config])
  const colorways = useMemo(
    () =>
      config.colorways?.length
        ? config.colorways
        : [{ id: 'base', name: config.color.name, swatch: config.color.swatch }],
    [config],
  )
  const [internalColorwayId, setInternalColorwayId] = useState(colorways[0].id)
  const colorwayId = controlledColorwayId ?? internalColorwayId
  const setColorwayId = (id: string) => {
    setInternalColorwayId(id)
    onColorwayChange?.(id)
  }
  const colorway = colorways.find((item) => item.id === colorwayId) ?? colorways[0]
  const [modeId, setModeId] = useState<ProductViewerMode>(
    modes[0]?.id ?? 'exterior',
  )
  const experience = modes.find((item) => item.id === modeId) ?? modes[0]
  const startIndex = Math.max(
    0,
    experience?.assets.findIndex(
      (asset) => asset.stateKey === experience.startKey,
    ) ?? 0,
  )
  const [index, setIndex] = useState(startIndex)
  const [hintVisible, setHintVisible] = useState(true)
  const [hotspot, setHotspot] = useState<ProductHotspot | null>(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [fallbackFullscreen, setFallbackFullscreen] = useState(false)
  const [coarse] = useState(() => mediaMatches('(pointer: coarse)'))
  const [reduceMotion] = useState(() =>
    mediaMatches('(prefers-reduced-motion: reduce)'),
  )
  const rootRef = useRef<HTMLDivElement>(null)
  const fullscreenBtnRef = useRef<HTMLButtonElement>(null)
  const outgoingTimer = useRef(0)
  const [outgoingAsset, setOutgoingAsset] = useState<
    ProductExperience['assets'][number] | null
  >(null)

  const sources = experience?.assets.map((asset) => asset.src) ?? []
  const { ready, isStartReady } = useImagePreloader(sources, startIndex)
  const imageWidth = experience?.assets[0]?.width ?? 1024
  const zoomState = useViewerZoom(imageWidth)
  const resetView = zoomState.reset

  const displayedIndex = wrapIndex(index, sources.length)
  const displayedAsset = resolveDisplayedAsset(
    experience?.assets ?? [],
    displayedIndex,
    ready,
  )
  const displayIndex = Math.max(
    0,
    experience?.assets.findIndex(
      (asset) =>
        asset.src === displayedAsset?.src &&
        asset.stateKey === displayedAsset.stateKey,
    ) ?? displayedIndex,
  )

  const onInteract = useCallback(() => setHintVisible(false), [])

  const rememberOutgoing = () => {
    if (reduceMotion || !displayedAsset) {
      setOutgoingAsset(null)
      return
    }
    setOutgoingAsset(displayedAsset)
    window.clearTimeout(outgoingTimer.current)
    outgoingTimer.current = window.setTimeout(() => setOutgoingAsset(null), 200)
  }

  const changeIndex = (value: number | ((current: number) => number)) => {
    rememberOutgoing()
    setIndex(value)
    setHotspot(null)
    onInteract()
  }

  const selectMode = (id: ProductViewerMode) => {
    const nextExperience = modes.find((item) => item.id === id)
    const nextIndex = Math.max(
      0,
      nextExperience?.assets.findIndex(
        (asset) => asset.stateKey === nextExperience.startKey,
      ) ?? 0,
    )
    rememberOutgoing()
    setModeId(id)
    setIndex(nextIndex)
    resetView()
    setHotspot(null)
    // Each mode gets one chance to show its own instruction.
    setHintVisible(true)
  }

  const toggleFullscreen = async () => {
    const node = rootRef.current
    if (fullscreen) {
      if (document.fullscreenElement) await document.exitFullscreen()
      setFullscreen(false)
      setFallbackFullscreen(false)
      fullscreenBtnRef.current?.focus()
      return
    }
    setFullscreen(true)
    if (node?.requestFullscreen) {
      try {
        await node.requestFullscreen()
        setFallbackFullscreen(false)
        return
      } catch {
        setFallbackFullscreen(true)
      }
    } else {
      setFallbackFullscreen(true)
    }
  }

  useEffect(() => {
    const onChange = () => {
      if (!document.fullscreenElement) {
        setFullscreen(false)
        setFallbackFullscreen(false)
        fullscreenBtnRef.current?.focus()
      }
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  useEffect(() => {
    if (!fullscreen) return
    const onEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape' || document.fullscreenElement) return
      setFullscreen(false)
      setFallbackFullscreen(false)
      fullscreenBtnRef.current?.focus()
    }
    document.addEventListener('keydown', onEscape)
    return () => document.removeEventListener('keydown', onEscape)
  }, [fullscreen])

  const onWheelZoom = (
    point: { x: number; y: number },
    deltaY: number,
    modifier: boolean,
  ): boolean => {
    // Plain scroll over an unzoomed image stays with the page; ctrl/cmd+scroll
    // (and any scroll once zoomed) zooms toward the cursor.
    if (!modifier && zoomState.zoom === 1) return false
    zoomState.applyZoomAt(zoomState.zoom * (deltaY > 0 ? 0.88 : 1.12), point)
    onInteract()
    return true
  }

  const stepAngle = (direction: number) => {
    if (!experience) return
    changeIndex((current) =>
      wrapIndex(current + direction, experience.assets.length),
    )
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!experience) return
    if (event.key === 'ArrowLeft' && experience.kind === 'angles') {
      event.preventDefault()
      changeIndex((current) => wrapIndex(current - 1, experience.assets.length))
    }
    if (event.key === 'ArrowRight' && experience.kind === 'angles') {
      event.preventDefault()
      changeIndex((current) => wrapIndex(current + 1, experience.assets.length))
    }
    if (event.key === '+' || event.key === '=') {
      event.preventDefault()
      zoomState.applyZoom(zoomState.zoom + 0.25)
    }
    if (event.key === '-' || event.key === '_') {
      event.preventDefault()
      zoomState.applyZoom(zoomState.zoom - 0.25)
    }
    if (event.key === '0') zoomState.reset()
  }

  if (!experience || !displayedAsset) return null

  let hint: string | null = null
  if (hintVisible && experience.kind === 'angles' && experience.assets.length > 1) {
    hint = coarse ? experience.instructionMobile : experience.instructionDesktop
  }

  const showHotspots = experience.id === 'features'
  const showAngleNav = experience.kind === 'angles' && experience.assets.length > 1

  const stateKey =
    experience.assets[displayedIndex]?.stateKey ?? experience.startKey
  const stageActions =
    experience.kind === 'states' ? visibleActions(experience, stateKey) : []

  const applyAction = (targetKey: string) => {
    const targetMode = modes.find((item) => item.id === targetKey)
    if (targetMode) {
      selectMode(targetMode.id)
      return
    }
    const next = experience.assets.findIndex(
      (asset) => asset.stateKey === targetKey,
    )
    if (next >= 0) changeIndex(next)
  }

  let stateChip: string
  if (experience.kind === 'angles') {
    stateChip = humanize(stateKey)
  } else if (experience.assets.length > 1) {
    stateChip = `${experience.label} · ${humanize(stateKey)}`
  } else {
    stateChip = experience.label
  }

  return (
    <FullscreenViewer
      active={fullscreen}
      fallback={fallbackFullscreen}
      label={model.name}
      onClose={() => void toggleFullscreen()}
    >
      <div
        className="product-viewer"
        ref={rootRef}
        style={{ '--pv-tint': colorway.filter ?? 'none' } as CSSProperties}
      >
        {fullscreen && !fallbackFullscreen ? (
          <div className="product-viewer-fullscreen-bar">
            <p>{model.name}</p>
            <button
              type="button"
              aria-label="Exit fullscreen"
              onClick={() => void toggleFullscreen()}
            >
              ×
            </button>
          </div>
        ) : null}
        <header className="product-viewer-masthead" hidden={embedded}>
          <h2>{model.name}</h2>
          <p className="product-viewer-color">
            <span
              className="product-viewer-swatch"
              style={{ background: colorway.swatch }}
            />
            Color · {colorway.name}
          </p>
          {colorways.length > 1 ? (
            <fieldset className="product-viewer-colors" aria-label="Choose color">
              {colorways.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="product-viewer-color-btn"
                  style={{ background: item.swatch }}
                  aria-label={`Color ${item.name}`}
                  aria-pressed={item.id === colorway.id}
                  onClick={() => setColorwayId(item.id)}
                />
              ))}
            </fieldset>
          ) : null}
          {colorway.filter ? (
            <p className="product-viewer-color-note">
              Digital colour preview, photographed in {config.color.name}.
            </p>
          ) : null}
        </header>

        {/* oxlint-disable jsx-a11y/no-noninteractive-element-interactions -- custom explorer widget */}
        {/* oxlint-disable jsx-a11y/no-noninteractive-tabindex -- custom explorer widget */}
        <div
          className="product-viewer-stage-wrap"
          role="application"
          tabIndex={0}
          aria-label={`${model.name} product viewer`}
          onKeyDown={onKeyDown}
        >
          <ProductViewerRenderer
            renderer={experience.renderer}
            assets={experience.assets}
            index={displayedIndex}
            displayIndex={displayIndex}
            previousAsset={outgoingAsset}
            zoom={zoomState.zoom}
            maxZoom={zoomState.maxZoom}
            pan={zoomState.pan}
            showHotspots={showHotspots}
            activeHotspotId={hotspot?.id ?? null}
            hint={hint}
            loading={!isStartReady}
            enabled={experience.kind === 'angles'}
            reduceMotion={reduceMotion}
            onIndexChange={changeIndex}
            onInteract={onInteract}
            onPan={zoomState.nudgePan}
            onZoomAt={zoomState.applyZoomAt}
            onZoomReset={resetView}
            onWheelZoom={onWheelZoom}
            onHotspot={(next) => {
              setHotspot(next)
              onInteract()
            }}
            onResize={zoomState.setRenderedWidth}
          />
          {showAngleNav ? (
            <>
              <button
                type="button"
                className="product-viewer-arrow product-viewer-arrow--prev"
                aria-label="Previous angle"
                onClick={() => stepAngle(-1)}
              >
                ‹
              </button>
              <button
                type="button"
                className="product-viewer-arrow product-viewer-arrow--next"
                aria-label="Next angle"
                onClick={() => stepAngle(1)}
              >
                ›
              </button>
            </>
          ) : null}
          <p className="product-viewer-state-chip" key={stateChip}>
            {stateChip}
          </p>
        </div>
        {/* oxlint-enable jsx-a11y/no-noninteractive-element-interactions */}
        {/* oxlint-enable jsx-a11y/no-noninteractive-tabindex */}

        {stageActions.length > 0 ? (
          <div className="product-viewer-stage-actions">
            {stageActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className="product-viewer-action"
                onClick={() => applyAction(action.targetKey)}
              >
                {action.label}
              </button>
            ))}
          </div>
        ) : null}

        {hotspot && showHotspots ? (
          <FeaturePanel
            hotspot={hotspot}
            hotspots={displayedAsset.hotspots ?? []}
            specs={model.specs}
            onSelect={setHotspot}
            onClose={() => setHotspot(null)}
          />
        ) : null}

        {showAngleNav ? (
          <fieldset
            className="product-viewer-angle-dots"
            aria-label="Viewing angle"
          >
            {experience.assets.map((asset, angleIndex) => (
              <button
                key={asset.stateKey}
                type="button"
                aria-label={`Show ${asset.stateKey.replaceAll('-', ' ')} view`}
                aria-pressed={angleIndex === displayedIndex}
                onClick={() => {
                  if (angleIndex === displayedIndex) return
                  changeIndex(angleIndex)
                }}
              />
            ))}
          </fieldset>
        ) : null}

        <ZoomControls
          zoom={zoomState.zoom}
          maxZoom={zoomState.maxZoom}
          onZoomIn={() => zoomState.applyZoom(zoomState.zoom + 0.25)}
          onZoomOut={() => zoomState.applyZoom(zoomState.zoom - 0.25)}
          onReset={zoomState.reset}
        />

        <ModeSelector
          modes={modes}
          activeId={experience.id}
          onSelect={selectMode}
        />

        <ViewerControls experience={experience} specs={model.specs} />

        <button
          ref={fullscreenBtnRef}
          type="button"
          className="product-viewer-fullscreen-btn"
          onClick={() => void toggleFullscreen()}
        >
          {fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        </button>
      </div>
    </FullscreenViewer>
  )
}
