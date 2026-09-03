import Seo from '../components/Seo'
import PageHero from '../components/ui/PageHero'
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
      <main id="main" className="site-page">
        <PageHero
          eyebrow="Insights"
          title="Amptron Blog"
          lede="Practical content for riders, dealers, and service teams. Ownership first, no hype."
        />
        <section className="page-section">
          <div className="wrap">
            {posts.length === 0 ? (
              <p className="content-note">No posts yet. Check back soon.</p>
            ) : (
              <div className="blog-grid">
                {posts.map((post) => (
                  <article className="blog-card" key={post.slug}>
                    <small>
                      {new Date(post.publishedAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </small>
                    <h2>{post.title}</h2>
                    <p>{post.excerpt}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
