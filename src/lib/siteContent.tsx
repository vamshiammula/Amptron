import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import { blogPosts, type BlogPost } from '../data/blogPosts'
import { scooterModels, type ScooterModel } from '../data/models'
import {
  mapBlogPost,
  mapScooterModel,
  mergeLocalModel,
  type SiteContentValue,
  type SiteMediaMap,
} from './siteContentMap'
import { hasSupabaseClient, supabase } from './supabase'

export type { SiteContentValue, SiteMediaMap } from './siteContentMap'

const LOCAL_MEDIA: SiteMediaMap = {
  heroVideo: '',
  heroPoster: '',
  techCutaway: '',
}

const PUBLIC_MODELS = scooterModels.filter((model) => model.slug !== 'amptron-volt')

const LOCAL_CONTENT: SiteContentValue = {
  catalogReady: true,
  models: PUBLIC_MODELS,
  posts: blogPosts,
  media: LOCAL_MEDIA,
  productViewers: {},
}

const SiteContentContext = createContext<SiteContentValue>(LOCAL_CONTENT)

async function readSiteContent(): Promise<SiteContentValue | null> {
  if (!hasSupabaseClient || !supabase) return null

  const [modelsResult, postsResult] = await Promise.all([
    supabase
      .from('scooter_models')
      .select('*')
      .eq('published', true)
      .order('sort_order', { ascending: true })
      .abortSignal(AbortSignal.timeout(10000)),
    supabase
      .from('blog_posts')
      .select('slug, title, excerpt, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .abortSignal(AbortSignal.timeout(10000)),
  ])

  const localBySlug = new Map(
    LOCAL_CONTENT.models.map((model) => [model.slug, model]),
  )
  const remoteModels = (modelsResult.data ?? [])
    .map((row) => mapScooterModel(row))
    .filter((row): row is ScooterModel => row !== null)
    .map((model) => mergeLocalModel(model, localBySlug.get(model.slug)))
  const remoteSlugs = new Set(remoteModels.map((model) => model.slug))
  const localOnly = LOCAL_CONTENT.models.filter(
    (model) => !remoteSlugs.has(model.slug),
  )
  const replacedByNira =
    remoteSlugs.has('amptron-nira') || localBySlug.has('amptron-nira')
  const models = [
    ...remoteModels.filter(
      (model) =>
        model.slug !== 'amptron-volt' &&
        !(model.slug === 'amptron-storm' && replacedByNira),
    ),
    ...localOnly,
  ]
  const posts = (postsResult.data ?? [])
    .map((row) => mapBlogPost(row))
    .filter((row): row is BlogPost => row !== null)

  if (modelsResult.error && postsResult.error) {
    return null
  }

  return {
    catalogReady: true,
    models: modelsResult.error
      ? LOCAL_CONTENT.models
      : remoteModels.length === 0
        ? remoteModels
        : models,
    posts: posts.length > 0 ? posts : LOCAL_CONTENT.posts,
    media: LOCAL_MEDIA,
    productViewers: {},
  }
}

let contentRequest: Promise<SiteContentValue | null> | null = null
function fetchSiteContent() {
  if (!contentRequest) {
    contentRequest = readSiteContent().finally(() => {
      contentRequest = null
    })
  }
  return contentRequest
}

export function SiteContentProvider({ children }: Readonly<PropsWithChildren>) {
  const [content, setContent] = useState<SiteContentValue>({
    ...LOCAL_CONTENT,
    catalogReady: import.meta.env.MODE === 'test' || !hasSupabaseClient,
  })

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return

    let active = true
    const refresh = () => {
      void fetchSiteContent()
        .then((next) => {
          if (active) setContent(next ?? LOCAL_CONTENT)
        })
        .catch(() => {
          if (active)
            setContent((previous) => ({ ...previous, catalogReady: true }))
        })
    }
    refresh()
    window.addEventListener('amptron:catalog-updated', refresh)

    return () => {
      active = false
      window.removeEventListener('amptron:catalog-updated', refresh)
    }
  }, [])

  return (
    <SiteContentContext.Provider value={content}>
      {children}
    </SiteContentContext.Provider>
  )
}

export function useSiteContent(): SiteContentValue {
  return useContext(SiteContentContext)
}

export function useScooterModel(slug: string): ScooterModel | undefined {
  const { models } = useSiteContent()
  return models.find((model) => model.slug === slug)
}
