import Contact from '../components/Contact'
import Dealers from '../components/Dealers'
import Hero from '../components/Hero'
import HomeFaq from '../components/HomeFaq'
import ModelRail from '../components/ModelRail'
import Numbers from '../components/Numbers'
import Ownership from '../components/Ownership'
import Seo from '../components/Seo'
import Technology from '../components/Technology'
import Testimonials from '../components/Testimonials'

export default function HomePage() {
  return (
    <>
      <Seo
        title="Amptron | Built to move forward"
        description="Explore Amptron electric scooters. Compare models, request a test ride, or connect with our dealer network."
        path="/"
      />
      <main id="main">
        <Hero />
        <ModelRail />
        <Technology />
        <Numbers />
        <Ownership />
        <Dealers />
        <Testimonials />
        <HomeFaq />
        <Contact />
      </main>
    </>
  )
}
