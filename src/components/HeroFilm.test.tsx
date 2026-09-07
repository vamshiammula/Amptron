import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { scooterModels } from '../data/models'
import HeroFilm from './HeroFilm'

describe('homepage product film', () => {
  it('plays the supplied film with controls and links to the separate explorer', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    const { container } = render(
      <MemoryRouter>
        <HeroFilm model={scooterModels[0]!} />
      </MemoryRouter>,
    )
    const video = container.querySelector('video')!
    expect(video).toHaveAttribute('src', scooterModels[0]!.video)
    expect(video).toHaveAttribute('controls')
    expect(video.muted).toBe(true)
    expect(screen.getByRole('link', { name: /Explore NIRA/ })).toHaveAttribute(
      'href',
      '/models/amptron-nira',
    )
    expect(container.querySelector('model-viewer')).toBeNull()
    fireEvent.error(video)
    expect(screen.getByRole('img')).toHaveAttribute('src', scooterModels[0]!.image)
    vi.restoreAllMocks()
  })
  it('does not start playback when reduced motion is requested', () => {
    vi.spyOn(window, 'matchMedia').mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as MediaQueryList)
    const play = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue()
    const pause = vi
      .spyOn(HTMLMediaElement.prototype, 'pause')
      .mockImplementation(() => {})
    render(
      <MemoryRouter>
        <HeroFilm model={scooterModels[0]!} />
      </MemoryRouter>,
    )
    expect(play).not.toHaveBeenCalled()
    expect(pause).toHaveBeenCalled()
    vi.restoreAllMocks()
  })
})
