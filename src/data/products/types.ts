export const PRODUCT_VIEWER_MODES = [
  'exterior',
  'seat',
  'storage',
  'battery',
  'charging',
  'lights',
  'dashboard',
  'features',
  '360',
] as const

export type ProductViewerMode = (typeof PRODUCT_VIEWER_MODES)[number]

export type ViewerRenderer = 'angles' | 'sequence' | 'threejs'
export type ExperienceKind = 'angles' | 'states'
export type MediaApproval = 'approved' | 'hold'
export type MediaLifecycle = 'draft' | 'published' | 'archived'
export type OrbitDirection = 'clockwise' | 'counterclockwise'

export interface ProductHotspot {
  id: string
  x: number
  y: number
  title: string
  description: string
  specLabel?: string
  imageSrc?: string
}

export interface ProductMediaAsset {
  src: string
  stateKey: string
  alt: string
  width: number
  height: number
  hotspots?: ProductHotspot[]
}

export interface ExperienceAction {
  id: string
  label: string
  targetKey: string
}

export interface ProductExperience {
  id: ProductViewerMode
  label: string
  kind: ExperienceKind
  renderer: ViewerRenderer
  enabled: boolean
  instructionDesktop: string
  instructionMobile: string
  startKey: string
  assets: ProductMediaAsset[]
  actions?: ExperienceAction[]
  infoTitle?: string
  specLabels?: string[]
}

export interface ProductColor {
  name: string
  swatch: string
}

export interface ProductColorway {
  id: string
  name: string
  swatch: string
  /**
   * CSS filter approximating this colourway on the photographed base set.
   * Present = digital preview (the UI discloses it); absent = real photos.
   */
  filter?: string
}

export interface ProductViewerConfig {
  brand: 'Amptron'
  modelSlug: string
  modelName: string
  color: ProductColor
  colorways?: ProductColorway[]
  experiences: ProductExperience[]
}
