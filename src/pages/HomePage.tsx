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
        title="Amptron: Powering India's Electric Future"
        description="Amptron is India's trusted EV scooter manufacturer. Buy certified electric scooters from us, or from a partner showroom."
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
