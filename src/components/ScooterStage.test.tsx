import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { scooterModels } from '../data/models'
import ScooterStage from './ScooterStage'
vi.mock('@google/model-viewer', () => ({}))

describe('ScooterStage', () => {
  it('has no image/video fetches and no fake interactive controls before assets exist', () => {
    const { container } = render(
      <ScooterStage
        model={{ ...scooterModels[0]!, image: '', model3d: undefined }}
      />,
    )
    expect(container.querySelectorAll('img, video, model-viewer')).toHaveLength(0)
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Photos/ })).toBeDisabled()
  })
  it('loads a real model-viewer element and enables controls only after its load event', async () => {
    const { container } = render(
      <ScooterStage model={{ ...scooterModels[0]!, model3d: '/media/nira.glb' }} />,
    )
    await waitFor(() =>
      expect(container.querySelector('model-viewer')).not.toBeNull(),
    )
    const viewer = container.querySelector('model-viewer')!
    expect(viewer).toHaveAttribute('camera-controls')
    expect(viewer).toHaveAttribute('src', '/media/nira.glb')
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled()
    fireEvent(viewer, new Event('load'))
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeEnabled()
  })
  it('exposes recovery when a model fails to load', async () => {
    const { container } = render(
      <ScooterStage model={{ ...scooterModels[0]!, model3d: '/missing.glb' }} />,
    )
    await waitFor(() =>
      expect(container.querySelector('model-viewer')).not.toBeNull(),
    )
    fireEvent(container.querySelector('model-viewer')!, new Event('error'))
    expect(screen.getByRole('alert')).toHaveTextContent('could not load')
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled()
  })
})

it('browses every NIRA photo, wraps and retains selection through media changes', () => {
  render(<ScooterStage model={scooterModels[0]!} />)
  fireEvent.click(screen.getByRole('button', { name: /Photos/ }))
  expect(screen.getByText('1 / 9 · Front three-quarter')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Previous photo' }))
  expect(screen.getByText('9 / 9 · Top')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Next photo' }))
  expect(screen.getByText('1 / 9 · Front three-quarter')).toBeInTheDocument()
  fireEvent.keyDown(screen.getByRole('button', { name: 'Next photo' }), {
    key: 'ArrowRight',
  })
  expect(screen.getByText('2 / 9 · Front')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'View rear' }))
  expect(screen.getByRole('img', { name: 'Amptron NIRA — Rear' })).toHaveAttribute(
    'src',
    '/products/amptron-nira/amptron-nira-pearl-ivory-rear.png',
  )
  fireEvent.click(screen.getByRole('button', { name: '3D view' }))
  fireEvent.click(screen.getByRole('button', { name: /Photos/ }))
  expect(screen.getByText('6 / 9 · Rear')).toBeInTheDocument()
})
