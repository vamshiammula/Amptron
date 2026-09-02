import { getAccessToken } from './supabase'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export interface DealerOrder {
  id: string
  model: string
  quantity: number
  status: string
  createdAt?: string
}

export interface DealerResource {
  id: string
  title: string
  url: string
  createdAt?: string
}

export interface DealerAnnouncement {
  id: string
  title: string
  body: string
  publishedAt: string
}

export interface DealerTicket {
  id: string
  subject: string
  status: string
  createdAt: string
}

export interface PortalSummary {
  accountName: string
  territory: string
  kpis: Array<{ label: string; value: string }>
  orders: DealerOrder[]
  resources: DealerResource[]
  announcements: DealerAnnouncement[]
  tickets: DealerTicket[]
}

export interface AdminApplicationsPayload {
  applications: Array<{
    id: string
    fullName: string
    email: string
    city: string
    status: string
    createdAt: string
  }>
  count: number
}

export interface AdminOverviewPayload {
  kpis: Array<{ label: string; value: string }>
  pipeline: Array<{ status: string; count: number }>
  recentOrders: DealerOrder[]
  recentTickets: DealerTicket[]
}

export interface AdminDealerAccount {
  id: string
  accountName: string
  role: 'dealer' | 'admin'
  territory: string | null
  createdAt: string
}

export interface PortalProfile {
  accountId: string
  accountName: string
  email: string | null
  role: 'dealer' | 'admin'
  territory: string | null
  capabilities: string[]
}

async function fetchWithAuth<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  })
  if (!response.ok) {
    let message = 'Request failed.'
    try {
      const body = (await response.json()) as { message?: string }
      if (body.message) message = body.message
    } catch {
      // ignore
    }
    throw new Error(message)
  }
  return (await response.json()) as T
}

export function fetchPortalSummary() {
  return fetchWithAuth<PortalSummary>('/api/portal/summary')
}

export function fetchPortalProfile() {
  return fetchWithAuth<PortalProfile>('/api/portal/me')
}

export function fetchPortalOrders() {
  return fetchWithAuth<{ orders: DealerOrder[]; count: number }>(
    '/api/portal/orders',
  )
}

export function fetchPortalResources() {
  return fetchWithAuth<{ resources: DealerResource[]; count: number }>(
    '/api/portal/resources',
  )
}

export function fetchPortalAnnouncements() {
  return fetchWithAuth<{ announcements: DealerAnnouncement[]; count: number }>(
    '/api/portal/announcements',
  )
}

export function fetchPortalTickets() {
  return fetchWithAuth<{ tickets: DealerTicket[]; count: number }>(
    '/api/portal/tickets',
  )
}

export function createSupportTicket(payload: { subject: string; detail: string }) {
  return fetchWithAuth<{ id: string; message: string }>('/api/portal/tickets', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function fetchAdminApplications() {
  return fetchWithAuth<AdminApplicationsPayload>('/api/admin/applications')
}

export function fetchAdminOverview() {
  return fetchWithAuth<AdminOverviewPayload>('/api/admin/overview')
}

export function fetchAdminDealerAccounts() {
  return fetchWithAuth<{ accounts: AdminDealerAccount[]; count: number }>(
    '/api/admin/dealer-accounts',
  )
}

export function fetchAdminDealers() {
  return fetchWithAuth<{
    dealers: Array<{
      id: string
      name: string
      city: string
      state: string
      area: string
      phone: string
    }>
    count?: number
  }>('/api/admin/dealers')
}

export function fetchAdminOrders() {
  return fetchWithAuth<{ orders: DealerOrder[]; count: number }>(
    '/api/admin/orders',
  )
}

export function fetchAdminTickets() {
  return fetchWithAuth<{ tickets: DealerTicket[]; count: number }>(
    '/api/admin/tickets',
  )
}

export function fetchAdminResources() {
  return fetchWithAuth<{ resources: DealerResource[]; count: number }>(
    '/api/admin/resources',
  )
}

export function fetchAdminAnnouncements() {
  return fetchWithAuth<{ announcements: DealerAnnouncement[]; count: number }>(
    '/api/admin/announcements',
  )
}

export function updateAdminApplicationStatus(id: string, status: string) {
  return fetchWithAuth<{ message: string }>(
    `/api/admin/applications/${id}/status`,
    {
      method: 'POST',
      body: JSON.stringify({ status }),
    },
  )
}

export function updateAdminOrderStatus(id: string, status: string) {
  return fetchWithAuth<{ message: string }>(`/api/admin/orders/${id}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  })
}

export function updateAdminTicketStatus(id: string, status: string) {
  return fetchWithAuth<{ message: string }>(`/api/admin/tickets/${id}/status`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  })
}

export interface CreateDealerLoginPayload {
  email: string
  password: string
  accountName: string
  territory?: string
  role?: 'dealer' | 'admin'
}

export function createDealerLogin(payload: CreateDealerLoginPayload) {
  return fetchWithAuth<{ message: string; dealerAccount: { id: string } }>(
    '/api/admin/dealer-accounts',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export function createDealerRecord(payload: {
  name: string
  city: string
  state: string
  area: string
  phone: string
}) {
  return fetchWithAuth<{ id: string }>('/api/admin/dealers', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function createAdminResource(payload: { title: string; fileUrl: string }) {
  return fetchWithAuth<{ id: string }>('/api/admin/resources', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function createAdminAnnouncement(payload: { title: string; body: string }) {
  return fetchWithAuth<{ id: string }>('/api/admin/announcements', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export interface AdminFaq {
  id: string
  slug: string
  question: string
  answer: string
  audience: string
  category: string
  aliases: string[]
  cta: string | null
  isActive: boolean
  isSeed: boolean
  hasEmbedding: boolean
  updatedAt: string
}

export interface AdminSupportQuery {
  id: string
  question: string
  name: string
  phone: string | null
  email: string | null
  preferredLanguage: string
  reason: string
  status: string
  notes: string | null
  createdAt: string
}

export function fetchAdminFaqs() {
  return fetchWithAuth<{ faqs: AdminFaq[]; count: number }>('/api/admin/faqs')
}

export function upsertAdminFaq(payload: {
  slug: string
  question: string
  answer: string
  audience: 'rider' | 'dealer' | 'both'
  category: string
  aliases: string[]
  cta: 'buy' | 'test_ride' | 'showroom' | 'stock' | null
  isActive: boolean
}) {
  return fetchWithAuth<{ faq: AdminFaq }>('/api/admin/faqs', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function patchAdminFaq(id: string, payload: Partial<AdminFaq>) {
  return fetchWithAuth<{ faq: AdminFaq }>(`/api/admin/faqs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteAdminFaq(id: string) {
  return fetchWithAuth<{ message: string }>(`/api/admin/faqs/${id}`, {
    method: 'DELETE',
  })
}

export function seedAdminFaqs() {
  return fetchWithAuth<{ message: string; upserted: number }>(
    '/api/admin/faqs/seed',
    {
      method: 'POST',
    },
  )
}

export function fetchAdminSupportQueries() {
  return fetchWithAuth<{ queries: AdminSupportQuery[]; count: number }>(
    '/api/admin/support-queries',
  )
}

export function updateAdminSupportQuery(
  id: string,
  payload: { status: string; notes?: string },
) {
  return fetchWithAuth<{ message: string }>(
    `/api/admin/support-queries/${id}/status`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )
}

export interface AdminProductMediaAsset {
  id: number
  object_path: string
  original_filename: string
  state_key: string
  sequence_index: number
  width: number
  height: number
  mime_type: string
  byte_size: number
  checksum: string
  alt: string
  approval: 'approved' | 'hold'
}

export interface AdminProductMediaSet {
  id: number
  mode: string
  version: number
  label: string
  lifecycle: string
  start_key: string | null
  direction: string | null
  published_at: string | null
  created_at: string
  scooter_models: { slug: string; name: string } | { slug: string; name: string }[]
  product_media_assets: AdminProductMediaAsset[]
}

export function fetchAdminProductMedia() {
  return fetchWithAuth<{ sets: AdminProductMediaSet[]; count: number }>(
    '/api/admin/product-media',
  )
}

export function createAdminProductMediaSet(payload: {
  modelSlug: string
  mode: string
  label: string
}) {
  return fetchWithAuth<{ set: { id: number }; model: { slug: string } }>(
    '/api/admin/product-media/sets',
    { method: 'POST', body: JSON.stringify(payload) },
  )
}

export function createAdminProductMediaTargets(
  setId: number,
  files: Array<{
    originalFilename: string
    stateKey: string
    sequenceIndex: number
    mimeType: string
    byteSize: number
  }>,
) {
  return fetchWithAuth<{
    targets: Array<{
      originalFilename: string
      stateKey: string
      sequenceIndex: number
      mimeType: string
      objectPath: string
      bucket: string
    }>
  }>(`/api/admin/product-media/sets/${setId}/upload-targets`, {
    method: 'POST',
    body: JSON.stringify({ files }),
  })
}

export function finalizeAdminProductMediaAssets(
  setId: number,
  assets: Array<{
    objectPath: string
    originalFilename: string
    stateKey: string
    sequenceIndex: number
    width: number
    height: number
    mimeType: string
    byteSize: number
    checksum: string
    alt: string
    approval: 'approved' | 'hold'
  }>,
) {
  return fetchWithAuth<{ assets: AdminProductMediaAsset[] }>(
    `/api/admin/product-media/sets/${setId}/assets`,
    { method: 'POST', body: JSON.stringify({ assets }) },
  )
}

export function patchAdminProductMediaSet(
  setId: number,
  payload: {
    startKey?: string
    direction?: 'clockwise' | 'counterclockwise' | null
    assets?: Array<{
      id: number
      sequenceIndex?: number
      approval?: 'approved' | 'hold'
      alt?: string
      stateKey?: string
    }>
    assetOrder?: number[]
  },
) {
  return fetchWithAuth<{ message: string }>(
    `/api/admin/product-media/sets/${setId}`,
    { method: 'PATCH', body: JSON.stringify(payload) },
  )
}

export function publishAdminProductMediaSet(setId: number) {
  return fetchWithAuth<{ message: string }>(
    `/api/admin/product-media/sets/${setId}/publish`,
    { method: 'POST' },
  )
}

export function archiveAdminProductMediaSet(setId: number) {
  return fetchWithAuth<{ message: string }>(
    `/api/admin/product-media/sets/${setId}/archive`,
    { method: 'POST' },
  )
}

export function deleteAdminProductMediaSet(setId: number) {
  return fetchWithAuth<{ message: string }>(
    `/api/admin/product-media/sets/${setId}`,
    { method: 'DELETE' },
  )
}
