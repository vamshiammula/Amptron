import type { ProductExperience } from '../../data/products/types'

type ProductAction = NonNullable<ProductExperience['actions']>[number]

/**
 * Contextual actions for the current state: only the steps that make physical
 * sense from here (e.g. you can only lift a battery that is already visible).
 */
export function visibleActions(
  experience: ProductExperience,
  stateKey: string,
): ProductAction[] {
  return (experience.actions ?? []).filter((action) => {
    if (action.targetKey === 'storage') return stateKey === 'open'
    if (action.targetKey === stateKey) return false
    if (experience.id === 'seat' && action.id === 'open-seat')
      return stateKey === 'closed'
    if (experience.id === 'seat' && action.id === 'close-seat')
      return stateKey === 'open'
    if (experience.id === 'battery' && action.id === 'show-battery') {
      return stateKey === 'installed'
    }
    if (experience.id === 'battery' && action.id === 'lift-battery') {
      return stateKey === 'visible'
    }
    if (experience.id === 'battery' && action.id === 'remove-battery') {
      return stateKey === 'removing'
    }
    if (experience.id === 'battery' && action.id === 'install-battery') {
      return (
        stateKey === 'visible' || stateKey === 'removed' || stateKey === 'removing'
      )
    }
    if (experience.id === 'charging' && action.id === 'open-port') {
      return stateKey === 'closed'
    }
    if (experience.id === 'charging' && action.id === 'connect-charger') {
      return stateKey === 'open'
    }
    if (experience.id === 'charging' && action.id === 'close-port') {
      return stateKey === 'open' || stateKey === 'connected'
    }
    return true
  })
}
