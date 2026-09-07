import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createModelTemplate } from '@shared/catalog'
import AdminCatalogPanel from './AdminCatalogPanel'

const db = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[],
  insert: vi.fn(),
  update: vi.fn(),
}))
vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({ order: async () => ({ data: db.rows, error: null }) }),
      insert: (payload: Record<string, unknown>) => {
        db.insert(payload)
        return {
          select: () => ({
            single: async () => {
              db.rows = [{ ...payload, id: 1 }]
              return { data: { id: 1 }, error: null }
            },
          }),
        }
      },
      update: (payload: Record<string, unknown>) => {
        db.update(payload)
        return {
          eq: async () => {
            db.rows = db.rows.map((row) => ({ ...row, ...payload }))
            return { error: null }
          },
        }
      },
    }),
  },
}))

describe('catalog manager', () => {
  beforeEach(() => {
    db.rows = []
    db.insert.mockClear()
    db.update.mockClear()
  })
  it('saves a new reusable draft with empty media slots', async () => {
    const user = userEvent.setup()
    render(<AdminCatalogPanel />)
    await user.type(screen.getByLabelText('Model name'), 'Amptron Next')
    await user.type(screen.getByLabelText('URL slug'), 'amptron-next')
    await user.click(screen.getByRole('button', { name: 'Save draft' }))
    await waitFor(() => expect(db.insert).toHaveBeenCalled())
    expect(db.insert.mock.calls[0]![0]).toMatchObject({
      name: 'Amptron Next',
      published: false,
      model_3d_url: '',
      image_url: '',
    })
    expect(
      await screen.findByText('Draft saved. It is not visible on the website.'),
    ).toBeVisible()
  })
  it('removes a published model without deleting its reusable draft', async () => {
    db.rows = [
      {
        ...createModelTemplate(),
        id: 3,
        slug: 'amptron-next',
        name: 'Amptron Next',
        published: true,
      },
    ]
    const user = userEvent.setup()
    render(<AdminCatalogPanel />)
    await user.click(
      await screen.findByRole('button', { name: 'Remove from site' }),
    )
    expect(db.update).toHaveBeenCalledWith({ published: false })
    expect(await screen.findByText(/removed from the website/)).toBeVisible()
  })
  it('explains a missing migration before a model save can fail', async () => {
    db.rows = [{ id: 1, name: 'Legacy model', slug: 'legacy-model' }]
    render(<AdminCatalogPanel />)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Catalog setup required',
    )
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeDisabled()
  })
})
