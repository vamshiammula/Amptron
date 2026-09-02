import { Router, type Request, type Response } from 'express'
import { createClient } from '@supabase/supabase-js'
import { asyncHandler } from '../asyncHandler.js'
import type { AppConfig } from '../config.js'

interface DealerRow {
  id: string
  name: string
  city: string
  state: string
  area: string
  phone: string
}

const fallbackDealers: DealerRow[] = [
  {
    id: 'd1',
    name: 'Greenline EV Hub',
    city: 'Ahmedabad',
    state: 'Gujarat',
    area: 'Thaltej',
    phone: '+91 95101 30001',
  },
  {
    id: 'd2',
    name: 'Urban Ride Motors',
    city: 'Pune',
    state: 'Maharashtra',
    area: 'Baner',
    phone: '+91 95101 30002',
  },
  {
    id: 'd3',
    name: 'NextVolt Mobility',
    city: 'Chennai',
    state: 'Tamil Nadu',
    area: 'Anna Nagar',
    phone: '+91 95101 30003',
  },
]

export function createDealerRoutes(config: AppConfig): Router {
  const router = Router()
  const client =
    config.supabase &&
    createClient(config.supabase.url, config.supabase.key, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

  router.get(
    '/dealers',
    asyncHandler(async (req: Request, res: Response) => {
      const state = String(req.query.state ?? '').trim()
      const city = String(req.query.city ?? '').trim()

      let rows = fallbackDealers
      if (client) {
        const query = client
          .from('dealers')
          .select('id, name, city, state, area, phone')
        if (state) query.eq('state', state)
        if (city) query.eq('city', city)
        const { data, error } = await query
          .order('state')
          .order('city')
          .order('name')
        if (!error && data) {
          rows = data as DealerRow[]
        }
      }

      const filtered = rows.filter((dealer) => {
        const stateMatch = !state || dealer.state === state
        const cityMatch = !city || dealer.city === city
        return stateMatch && cityMatch
      })

      res.json({ dealers: filtered, count: filtered.length })
    }),
  )

  return router
}
