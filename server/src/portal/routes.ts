import { randomUUID } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'
import { Router, type Response } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../asyncHandler.js'
import { createActorResolver, type AuthedRequest } from '../auth.js'
import type { AppConfig } from '../config.js'

const ticketSchema = z.object({
  subject: z.string().trim().min(4).max(120),
  detail: z.string().trim().min(10).max(2000),
})

const ticketStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'closed']),
})

interface OrderRow {
  id: string
  model: string
  quantity: number
  status: string
  created_at: string
}

interface ResourceRow {
  id: string
  title: string
  file_url: string
  created_at: string
}

interface AnnouncementRow {
  id: string
  title: string
  body: string
  published_at: string
}

interface TicketRow {
  id: string
  subject: string
  status: string
  created_at: string
}

function toOrder(row: OrderRow) {
  return {
    id: String(row.id),
    model: String(row.model),
    quantity: Number(row.quantity),
    status: String(row.status),
    createdAt: String(row.created_at),
  }
}

function toResource(row: ResourceRow) {
  return {
    id: String(row.id),
    title: String(row.title),
    url: String(row.file_url),
    createdAt: String(row.created_at),
  }
}

function toAnnouncement(row: AnnouncementRow) {
  return {
    id: String(row.id),
    title: String(row.title),
    body: String(row.body),
    publishedAt: String(row.published_at),
  }
}

function toTicket(row: TicketRow) {
  return {
    id: String(row.id),
    subject: String(row.subject),
    status: String(row.status),
    createdAt: String(row.created_at),
  }
}

export function createPortalRoutes(config: AppConfig): Router {
  const router = Router()
  const resolveActor = createActorResolver(config)
  const hasSupabase = Boolean(config.supabase)
  const client = createClient(
    config.supabase?.url ?? 'https://invalid.local',
    config.supabase?.key ?? 'invalid',
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  )

  const requireClient = (res: Response): boolean => {
    if (hasSupabase) return true
    res.status(503).json({
      error: 'unavailable',
      message: 'Supabase is not configured on the server.',
    })
    return false
  }

  router.get(
    '/portal/me',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res)
      if (!actor) return

      const capabilities =
        actor.role === 'admin'
          ? [
              'Review and approve dealer applications',
              'Create dealer and admin logins',
              'Manage dealer network records',
              'Update order and ticket statuses',
              'Publish resources and announcements',
            ]
          : [
              'Track only your own orders',
              'Access active resources and announcements',
              'Raise and monitor support tickets',
              'Update your own ticket statuses',
            ]

      res.json({
        accountId: actor.accountId,
        accountName: actor.accountName,
        email: actor.email,
        role: actor.role,
        territory: actor.territory,
        capabilities,
      })
    }),
  )

  router.get(
    '/portal/summary',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res)
      if (!actor) return
      if (!requireClient(res)) return

      const [ordersResult, resourcesResult, announcementsResult, ticketsResult] =
        await Promise.all([
          client
            .from('dealer_orders')
            .select('id, model, quantity, status, created_at')
            .eq('dealer_account_id', actor.accountId)
            .order('created_at', { ascending: false })
            .limit(6),
          client
            .from('resources')
            .select('id, title, file_url, created_at')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(6),
          client
            .from('announcements')
            .select('id, title, body, published_at')
            .order('published_at', { ascending: false })
            .limit(6),
          client
            .from('tickets')
            .select('id, subject, status, created_at')
            .eq('dealer_account_id', actor.accountId)
            .order('created_at', { ascending: false })
            .limit(6),
        ])

      if (ordersResult.error) {
        throw new Error(`Could not load orders: ${ordersResult.error.message}`)
      }
      if (resourcesResult.error) {
        throw new Error(
          `Could not load resources: ${resourcesResult.error.message}`,
        )
      }
      if (announcementsResult.error) {
        throw new Error(
          `Could not load announcements: ${announcementsResult.error.message}`,
        )
      }
      if (ticketsResult.error) {
        throw new Error(`Could not load tickets: ${ticketsResult.error.message}`)
      }

      const orders = (ordersResult.data as OrderRow[] | null)?.map(toOrder) ?? []
      const resources =
        (resourcesResult.data as ResourceRow[] | null)?.map(toResource) ?? []
      const announcements =
        (announcementsResult.data as AnnouncementRow[] | null)?.map(
          toAnnouncement,
        ) ?? []
      const tickets =
        (ticketsResult.data as TicketRow[] | null)?.map(toTicket) ?? []

      res.json({
        accountName: actor.accountName,
        territory: actor.territory ?? 'Assigned Region',
        kpis: [
          { label: 'Pending Orders', value: String(orders.length) },
          {
            label: 'Open Tickets',
            value: String(tickets.filter((t) => t.status !== 'closed').length),
          },
          { label: 'Resources', value: String(resources.length) },
          { label: 'Announcements', value: String(announcements.length) },
        ],
        orders,
        resources,
        announcements,
        tickets,
      })
    }),
  )

  router.get(
    '/portal/orders',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res)
      if (!actor) return
      if (!requireClient(res)) return
      const { data, error } = await client
        .from('dealer_orders')
        .select('id, model, quantity, status, created_at')
        .eq('dealer_account_id', actor.accountId)
        .order('created_at', { ascending: false })
      if (error) throw new Error(`Could not load orders: ${error.message}`)
      const orders = (data as OrderRow[] | null)?.map(toOrder) ?? []
      res.json({ orders, count: orders.length })
    }),
  )

  router.get(
    '/portal/resources',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res)
      if (!actor) return
      if (!requireClient(res)) return
      const { data, error } = await client
        .from('resources')
        .select('id, title, file_url, created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (error) throw new Error(`Could not load resources: ${error.message}`)
      const resources = (data as ResourceRow[] | null)?.map(toResource) ?? []
      res.json({ resources, count: resources.length })
    }),
  )

  router.get(
    '/portal/announcements',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res)
      if (!actor) return
      if (!requireClient(res)) return
      const { data, error } = await client
        .from('announcements')
        .select('id, title, body, published_at')
        .order('published_at', { ascending: false })
      if (error) throw new Error(`Could not load announcements: ${error.message}`)
      const announcements =
        (data as AnnouncementRow[] | null)?.map(toAnnouncement) ?? []
      res.json({ announcements, count: announcements.length })
    }),
  )

  router.get(
    '/portal/tickets',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res)
      if (!actor) return
      if (!requireClient(res)) return
      const { data, error } = await client
        .from('tickets')
        .select('id, subject, status, created_at')
        .eq('dealer_account_id', actor.accountId)
        .order('created_at', { ascending: false })
      if (error) throw new Error(`Could not load tickets: ${error.message}`)
      const tickets = (data as TicketRow[] | null)?.map(toTicket) ?? []
      res.json({ tickets, count: tickets.length })
    }),
  )

  router.post(
    '/portal/tickets',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res)
      if (!actor) return
      if (!requireClient(res)) return

      const parsed = ticketSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(422).json({
          error: 'validation_failed',
          message: 'Please complete subject and detail.',
        })
        return
      }

      const id = randomUUID()
      const { error } = await client.from('tickets').insert({
        id,
        dealer_account_id: actor.accountId,
        subject: parsed.data.subject,
        detail: parsed.data.detail,
        status: 'open',
      })
      if (error) throw new Error(`Could not save ticket: ${error.message}`)

      res.status(201).json({
        id,
        message: 'Ticket submitted. Dealer support will respond shortly.',
      })
    }),
  )

  router.post(
    '/portal/tickets/:id/status',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res)
      if (!actor) return
      if (!requireClient(res)) return
      const parsed = ticketStatusSchema.safeParse(req.body)
      if (!parsed.success) {
        res
          .status(422)
          .json({ error: 'validation_failed', message: 'Invalid ticket status.' })
        return
      }

      const ticketId = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id
      if (!ticketId) {
        res
          .status(400)
          .json({ error: 'validation_failed', message: 'Missing ticket id.' })
        return
      }
      const { error } = await client
        .from('tickets')
        .update({ status: parsed.data.status })
        .eq('id', ticketId)
        .eq('dealer_account_id', actor.accountId)
      if (error) throw new Error(`Could not update ticket status: ${error.message}`)
      res.json({ message: `Ticket marked ${parsed.data.status}.` })
    }),
  )

  return router
}
