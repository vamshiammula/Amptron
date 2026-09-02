import Contact from '../components/Contact'
import Dealers from '../components/Dealers'
import Hero from '../components/Hero'
import Numbers from '../components/Numbers'
import Products from '../components/Products'
import Seo from '../components/Seo'
import Technology from '../components/Technology'
import Testimonials from '../components/Testimonials'
import WhyAmptron from '../components/WhyAmptron'

export default function HomePage() {
  return (
    <>
      <Seo
        title="Amptron — Powering India's Electric Future"
        description="Amptron is India's trusted EV scooter manufacturer. Buy certified electric scooters from us, or from a partner showroom."
        path="/"
      />
      <main id="main">
        <Hero />
        <Products />
        <WhyAmptron />
        <Technology />
        <Dealers />
        <Numbers />
        <Testimonials />
        <Contact />
      </main>
    </>
  )
}
