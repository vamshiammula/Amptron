import { Link } from 'react-router-dom'
import Seo from '../components/Seo'

export default function NotFoundPage() {
  return (
    <>
      <Seo
        title="Page Not Found — Amptron"
        description="The requested page could not be found."
        path="/404"
      />
      <main id="main" className="content-page narrow-page">
        <section className="content-hero">
          <h1>Page Not Found</h1>
          <p>The page you are looking for is unavailable.</p>
          <Link className="btn btn-primary" to="/">
            Return to Home
          </Link>
        </section>
      </main>
    </>
  )
}
