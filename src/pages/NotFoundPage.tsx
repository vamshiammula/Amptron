import { Link } from 'react-router-dom'
import ModelRail from '../components/ModelRail'
import Seo from '../components/Seo'
import PageHero from '../components/ui/PageHero'

export default function NotFoundPage() {
  return (
    <>
      <Seo
        title="Page Not Found: Amptron"
        description="The requested page could not be found."
        path="/404"
      />
      <main id="main" className="site-page">
        <PageHero
          eyebrow="404"
          title="Page Not Found"
          lede="The page you are looking for is unavailable. The scooters are still here."
          narrow
        >
          <Link className="btn btn-primary" to="/">
            Return to Home
          </Link>
          <Link className="btn btn-ghost-dark" to="/models">
            See the scooters
          </Link>
        </PageHero>
        <ModelRail />
      </main>
    </>
  )
}
