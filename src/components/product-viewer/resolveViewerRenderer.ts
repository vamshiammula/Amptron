import type { ViewerRenderer } from '../../data/products/types'
import ExteriorAngleViewer from './ExteriorAngleViewer'

/**
 * Renderer contract for the product explorer.
 * Exterior and discrete-state modes share ExteriorAngleViewer.
 * A verified contiguous shoot can later return Image360Viewer for `sequence`
 * without changing mode controls, fullscreen, or the product page.
 */
export function resolveViewerRenderer(
  renderer: ViewerRenderer,
): typeof ExteriorAngleViewer {
  switch (renderer) {
    case 'sequence':
    case 'threejs':
    case 'angles':
      return ExteriorAngleViewer
  }
}
