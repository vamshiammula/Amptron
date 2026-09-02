import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'
import heroScooter from '../assets/images/hero-scooter.webp'
import cutaway from '../assets/images/technical-cutaway.webp'
import { blogPosts, type BlogPost } from '../data/blogPosts'
import { scooterModels, type ScooterModel } from '../data/models'
import {
  mapBlogPost,
  mapScooterModel,
  mapSiteMedia,
  type SiteContentValue,
  type SiteMediaMap,
} from './siteContentMap'
import {
  LOCAL_PRODUCT_VIEWERS,
  mapPublishedViewerConfigs,
  type ProductMediaSetRow,
} from './productMediaMap'
import { hasSupabaseClient, supabase } from './supabase'

export type { SiteContentValue, SiteMediaMap } from './siteContentMap'

function storagePublicUrl(objectPath: string): string {
  const base = import.meta.env.VITE_SUPABASE_URL
  if (typeof base !== 'string' || base.length === 0) return ''
  return `${base.replace(/\/$/, '')}/storage/v1/object/public/site-media/${objectPath}`
}

const LOCAL_MEDIA: SiteMediaMap = {
  heroVideo: storagePublicUrl('hero/hero-showcase.mp4'),
  heroPoster: storagePublicUrl('hero/hero-scooter.webp') || heroScooter,
  techCutaway: storagePublicUrl('tech/technical-cutaway.webp') || cutaway,
}

const LOCAL_CONTENT: SiteContentValue = {
  models: scooterModels,
  posts: blogPosts,
  media: LOCAL_MEDIA,
  productViewers: LOCAL_PRODUCT_VIEWERS,
}

const SiteContentContext = createContext<SiteContentValue>(LOCAL_CONTENT)

async function fetchSiteContent(): Promise<SiteContentValue | null> {
  if (!hasSupabaseClient || !supabase) return null

  const [modelsResult, postsResult, mediaResult, viewerResult] = await Promise.all([
    supabase
      .from('scooter_models')
      .select(
        'slug, name, tagline, description, image_url, featured, highlights, specs, features',
      )
      .eq('published', true)
      .order('sort_order', { ascending: true }),
    supabase
      .from('blog_posts')
      .select('slug, title, excerpt, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false }),
    supabase.from('site_media').select('key, url'),
    supabase
      .from('product_media_sets')
      .select(
        'id, mode, label, lifecycle, start_key, scooter_models!inner ( slug ), product_media_assets ( object_path, state_key, sequence_index, alt, width, height, approval, hotspots )',
      )
      .eq('lifecycle', 'published'),
  ])

  const models = (modelsResult.data ?? [])
    .map((row) => mapScooterModel(row))
    .filter((row): row is ScooterModel => row !== null)
  const posts = (postsResult.data ?? [])
    .map((row) => mapBlogPost(row))
    .filter((row): row is BlogPost => row !== null)

  if (models.length === 0 && posts.length === 0 && !mediaResult.data?.length) {
    return null
  }

  return {
    models: models.length > 0 ? models : LOCAL_CONTENT.models,
    posts: posts.length > 0 ? posts : LOCAL_CONTENT.posts,
    media: mapSiteMedia(mediaResult.data ?? [], LOCAL_MEDIA),
    productViewers: mapPublishedViewerConfigs(
      viewerResult.error ? [] : ((viewerResult.data ?? []) as ProductMediaSetRow[]),
      (objectPath) => storagePublicUrl(objectPath),
      LOCAL_PRODUCT_VIEWERS,
    ),
  }
}

export function SiteContentProvider({ children }: Readonly<PropsWithChildren>) {
  const [content, setContent] = useState<SiteContentValue>(LOCAL_CONTENT)

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return

    let active = true
    fetchSiteContent()
      .then((next) => {
        if (active && next) setContent(next)
      })
      .catch(() => {
        // Keep the local catalog if Supabase is unreachable.
      })

    return () => {
      active = false
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
