import { createClient } from '@supabase/supabase-js'
import { Router, type Response } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../asyncHandler.js'
import { createActorResolver, type AuthedRequest } from '../auth.js'
import {
  RepositoryPermissionError,
  type ApplicationsRepository,
  type StoredApplication,
} from '../applications/repository.js'
import type { AppConfig } from '../config.js'

const statusSchema = z.object({
  status: z.enum(['new', 'contacted', 'approved', 'rejected']),
})

const dealerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(80),
  state: z.string().trim().min(2).max(80),
  area: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(8).max(20),
})

const resourceSchema = z.object({
  title: z.string().trim().min(4).max(120),
  fileUrl: z.url(),
})

const announcementSchema = z.object({
  title: z.string().trim().min(4).max(120),
  body: z.string().trim().min(10).max(2000),
})

const dealerAccountSchema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
  accountName: z.string().trim().min(2).max(120),
  territory: z.string().trim().min(2).max(120).optional(),
  role: z.enum(['dealer', 'admin']).default('dealer'),
})

const orderStatusSchema = z.object({
  status: z.enum(['pending', 'in_dispatch', 'shipped', 'delivered', 'cancelled']),
})

const ticketStatusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'closed']),
})

function normalizeId(param: string | string[] | undefined): string | null {
  if (Array.isArray(param)) return param[0] ?? null
  return param ?? null
}

export function createAdminRoutes(
  config: AppConfig,
  applicationsRepository: ApplicationsRepository,
): Router {
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

  const listApplicationsSafe = async (): Promise<{
    applications: StoredApplication[]
  }> => {
    try {
      const applications = await applicationsRepository.list({ limit: 500 })
      return { applications }
    } catch (error) {
      if (error instanceof RepositoryPermissionError) {
        return { applications: [] }
      }
      throw error
    }
  }

  router.get(
    '/admin/overview',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      if (!hasSupabase) {
        res.json({
          kpis: [
            { label: 'Applications', value: '0' },
            { label: 'Dealer Accounts', value: '0' },
            { label: 'Open Tickets', value: '0' },
            { label: 'Pending Orders', value: '0' },
          ],
          pipeline: [],
          recentOrders: [],
          recentTickets: [],
        })
        return
      }

      const { applications } = await listApplicationsSafe()
      const [
        dealerAccounts,
        openTickets,
        pendingOrders,
        recentOrders,
        recentTickets,
      ] = await Promise.all([
        client.from('dealer_accounts').select('id', { count: 'exact', head: true }),
        client
          .from('tickets')
          .select('id', { count: 'exact', head: true })
          .in('status', ['open', 'in_progress']),
        client
          .from('dealer_orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'in_dispatch']),
        client
          .from('dealer_orders')
          .select('id, model, quantity, status, created_at')
          .order('created_at', { ascending: false })
          .limit(8),
        client
          .from('tickets')
          .select('id, subject, status, created_at')
          .order('created_at', { ascending: false })
          .limit(8),
      ])

      const statuses: Array<'new' | 'contacted' | 'approved' | 'rejected'> = [
        'new',
        'contacted',
        'approved',
        'rejected',
      ]
      const pipeline = statuses.map((state) => ({
        status: state,
        count: applications.filter((application) => application.status === state)
          .length,
      }))

      res.json({
        kpis: [
          { label: 'Applications', value: String(applications.length) },
          { label: 'Dealer Accounts', value: String(dealerAccounts.count ?? 0) },
          { label: 'Open Tickets', value: String(openTickets.count ?? 0) },
          { label: 'Pending Orders', value: String(pendingOrders.count ?? 0) },
        ],
        pipeline,
        recentOrders:
          recentOrders.data?.map((row) => ({
            id: String(row.id),
            model: String(row.model),
            quantity: Number(row.quantity),
            status: String(row.status),
            createdAt: String(row.created_at),
          })) ?? [],
        recentTickets:
          recentTickets.data?.map((row) => ({
            id: String(row.id),
            subject: String(row.subject),
            status: String(row.status),
            createdAt: String(row.created_at),
          })) ?? [],
      })
    }),
  )

  router.get(
    '/admin/applications',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      const { applications } = await listApplicationsSafe()
      res.json({
        applications,
        count: applications.length,
        actor: actor.accountName,
      })
    }),
  )

  router.post(
    '/admin/applications/:id/status',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      const parsed = statusSchema.safeParse(req.body)
      if (!parsed.success) {
        res
          .status(422)
          .json({ error: 'validation_failed', message: 'Invalid status.' })
        return
      }
      const applicationId = normalizeId(req.params.id)
      if (!applicationId) {
        res
          .status(400)
          .json({ error: 'validation_failed', message: 'Missing application id.' })
        return
      }
      const updated = await applicationsRepository.updateStatus(
        applicationId,
        parsed.data.status,
      )
      res.json({
        message: `Application marked ${updated.status}.`,
        application: updated,
      })
    }),
  )

  router.get(
    '/admin/dealers',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      if (!requireClient(res)) return

      const { data, error } = await client
        .from('dealers')
        .select('id, name, city, state, area, phone')
        .order('state')
        .order('city')
      if (error) throw new Error(`Could not load dealers: ${error.message}`)
      res.json({ dealers: data ?? [], count: (data ?? []).length })
    }),
  )

  router.post(
    '/admin/dealers',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      const parsed = dealerSchema.safeParse(req.body)
      if (!parsed.success) {
        res
          .status(422)
          .json({ error: 'validation_failed', message: 'Invalid dealer payload.' })
        return
      }
      if (!requireClient(res)) return

      const { data, error } = await client
        .from('dealers')
        .insert(parsed.data)
        .select('id, name, city, state, area, phone')
        .single()
      if (error) throw new Error(`Could not create dealer: ${error.message}`)
      res.status(201).json(data)
    }),
  )

  router.get(
    '/admin/dealer-accounts',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      if (!requireClient(res)) return

      const { data, error } = await client
        .from('dealer_accounts')
        .select('id, account_name, role, territory, created_at')
        .order('created_at', { ascending: false })
      if (error) throw new Error(`Could not load dealer accounts: ${error.message}`)
      const accounts =
        data?.map((row) => ({
          id: String(row.id),
          accountName: String(row.account_name),
          role: row.role as 'dealer' | 'admin',
          territory: row.territory ? String(row.territory) : null,
          createdAt: String(row.created_at),
        })) ?? []
      res.json({ accounts, count: accounts.length })
    }),
  )

  router.post(
    '/admin/dealer-accounts',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      const parsed = dealerAccountSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(422).json({
          error: 'validation_failed',
          message:
            'Provide valid dealer account details: email, password, account name, and role.',
        })
        return
      }

      if (!requireClient(res)) return
      if (!config.supabase?.canRead) {
        res.status(503).json({
          error: 'configuration_error',
          message:
            'Creating dealer logins requires SUPABASE_SERVICE_ROLE_KEY on the server.',
        })
        return
      }

      const { data: createdUser, error: userError } =
        await client.auth.admin.createUser({
          email: parsed.data.email,
          password: parsed.data.password,
          email_confirm: true,
          app_metadata: { role: parsed.data.role },
        })

      if (userError || !createdUser.user) {
        res.status(400).json({
          error: 'user_create_failed',
          message: userError?.message ?? 'Could not create dealer login user.',
        })
        return
      }

      const insertPayload = {
        auth_user_id: createdUser.user.id,
        account_name: parsed.data.accountName,
        territory: parsed.data.territory ?? null,
        role: parsed.data.role,
      }

      const { data, error } = await client
        .from('dealer_accounts')
        .insert(insertPayload)
        .select('id, auth_user_id, account_name, territory, role')
        .single()

      if (error) {
        await client.auth.admin.deleteUser(createdUser.user.id)
        res.status(400).json({
          error: 'account_create_failed',
          message: `Dealer account row could not be created: ${error.message}`,
        })
        return
      }

      res.status(201).json({
        message: 'Dealer login created successfully.',
        dealerAccount: data,
      })
    }),
  )

  router.get(
    '/admin/orders',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      if (!requireClient(res)) return

      const { data, error } = await client
        .from('dealer_orders')
        .select('id, model, quantity, status, created_at')
        .order('created_at', { ascending: false })
      if (error) throw new Error(`Could not load orders: ${error.message}`)
      const orders =
        data?.map((row) => ({
          id: String(row.id),
          model: String(row.model),
          quantity: Number(row.quantity),
          status: String(row.status),
          createdAt: String(row.created_at),
        })) ?? []
      res.json({ orders, count: orders.length })
    }),
  )

  router.post(
    '/admin/orders/:id/status',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      if (!requireClient(res)) return

      const parsed = orderStatusSchema.safeParse(req.body)
      if (!parsed.success) {
        res
          .status(422)
          .json({ error: 'validation_failed', message: 'Invalid order status.' })
        return
      }
      const id = normalizeId(req.params.id)
      if (!id) {
        res
          .status(400)
          .json({ error: 'validation_failed', message: 'Missing order id.' })
        return
      }
      const { error } = await client
        .from('dealer_orders')
        .update({ status: parsed.data.status })
        .eq('id', id)
      if (error) throw new Error(`Could not update order status: ${error.message}`)
      res.json({ message: `Order marked ${parsed.data.status}.` })
    }),
  )

  router.get(
    '/admin/tickets',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      if (!requireClient(res)) return

      const { data, error } = await client
        .from('tickets')
        .select('id, subject, status, created_at')
        .order('created_at', { ascending: false })
      if (error) throw new Error(`Could not load tickets: ${error.message}`)
      const tickets =
        data?.map((row) => ({
          id: String(row.id),
          subject: String(row.subject),
          status: String(row.status),
          createdAt: String(row.created_at),
        })) ?? []
      res.json({ tickets, count: tickets.length })
    }),
  )

  router.post(
    '/admin/tickets/:id/status',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      if (!requireClient(res)) return

      const parsed = ticketStatusSchema.safeParse(req.body)
      if (!parsed.success) {
        res
          .status(422)
          .json({ error: 'validation_failed', message: 'Invalid ticket status.' })
        return
      }
      const id = normalizeId(req.params.id)
      if (!id) {
        res
          .status(400)
          .json({ error: 'validation_failed', message: 'Missing ticket id.' })
        return
      }
      const { error } = await client
        .from('tickets')
        .update({ status: parsed.data.status })
        .eq('id', id)
      if (error) throw new Error(`Could not update ticket status: ${error.message}`)
      res.json({ message: `Ticket marked ${parsed.data.status}.` })
    }),
  )

  router.get(
    '/admin/resources',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      if (!requireClient(res)) return

      const { data, error } = await client
        .from('resources')
        .select('id, title, file_url, created_at')
        .order('created_at', { ascending: false })
      if (error) throw new Error(`Could not load resources: ${error.message}`)
      const resources =
        data?.map((row) => ({
          id: String(row.id),
          title: String(row.title),
          url: String(row.file_url),
          createdAt: String(row.created_at),
        })) ?? []
      res.json({ resources, count: resources.length })
    }),
  )

  router.post(
    '/admin/resources',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      const parsed = resourceSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(422).json({
          error: 'validation_failed',
          message: 'Invalid resource payload.',
        })
        return
      }
      if (!requireClient(res)) return

      const { data, error } = await client
        .from('resources')
        .insert({
          title: parsed.data.title,
          file_url: parsed.data.fileUrl,
          is_active: true,
        })
        .select('id, title, file_url')
        .single()
      if (error) throw new Error(`Could not create resource: ${error.message}`)
      res.status(201).json(data)
    }),
  )

  router.get(
    '/admin/announcements',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      if (!requireClient(res)) return

      const { data, error } = await client
        .from('announcements')
        .select('id, title, body, published_at')
        .order('published_at', { ascending: false })
      if (error) throw new Error(`Could not load announcements: ${error.message}`)
      const announcements =
        data?.map((row) => ({
          id: String(row.id),
          title: String(row.title),
          body: String(row.body),
          publishedAt: String(row.published_at),
        })) ?? []
      res.json({ announcements, count: announcements.length })
    }),
  )

  router.post(
    '/admin/announcements',
    asyncHandler(async (req: AuthedRequest, res: Response) => {
      const actor = await resolveActor(req, res, 'admin')
      if (!actor) return
      const parsed = announcementSchema.safeParse(req.body)
      if (!parsed.success) {
        res.status(422).json({
          error: 'validation_failed',
          message: 'Invalid announcement payload.',
        })
        return
      }
      if (!requireClient(res)) return

      const { data, error } = await client
        .from('announcements')
        .insert({ title: parsed.data.title, body: parsed.data.body })
        .select('id, title, body, published_at')
        .single()
      if (error) throw new Error(`Could not create announcement: ${error.message}`)
      res.status(201).json(data)
    }),
  )

  return router
}
