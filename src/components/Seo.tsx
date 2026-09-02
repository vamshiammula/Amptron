import { Helmet } from 'react-helmet-async'

interface SeoProps {
  title: string
  description: string
  path?: string
  image?: string
}

const SITE_URL = 'https://www.amptron.co.in'
const DEFAULT_IMAGE = `${SITE_URL}/og-cover.svg`

export default function Seo({
  title,
  description,
  path = '/',
  image = DEFAULT_IMAGE,
}: SeoProps) {
  const absoluteUrl = `${SITE_URL}${path}`

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={absoluteUrl} />

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="Amptron" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={absoluteUrl} />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  )
}
