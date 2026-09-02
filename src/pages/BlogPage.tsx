import Seo from '../components/Seo'
import { useSiteContent } from '../lib/siteContent'

export default function BlogPage() {
  const { posts } = useSiteContent()

  return (
    <>
      <Seo
        title="Amptron Insights"
        description="Ownership playbooks, EV market insights, and service best practices for Amptron riders and dealers."
        path="/blog"
      />
      <main id="main" className="content-page">
        <section className="content-hero">
          <p className="content-eyebrow">Insights</p>
          <h1>Amptron Blog</h1>
          <p>Practical content for riders, dealers, and service teams.</p>
        </section>
        <section className="blog-grid">
          {posts.map((post) => (
            <article className="blog-card" key={post.slug}>
              <small>{new Date(post.publishedAt).toLocaleDateString()}</small>
              <h2>{post.title}</h2>
              <p>{post.excerpt}</p>
            </article>
          ))}
        </section>
      </main>
    </>
  )
}
