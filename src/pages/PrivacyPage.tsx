import Seo from '../components/Seo'

export default function PrivacyPage() {
  return (
    <>
      <Seo
        title="Amptron Privacy Policy"
        description="How Amptron collects, uses, and safeguards rider, dealer, and visitor data."
        path="/privacy"
      />
      <main id="main" className="content-page narrow-page">
        <section className="content-hero">
          <h1>Privacy Policy</h1>
          <p>
            Amptron collects contact and profile data from riders, dealers, and
            visitors for purchase requests, partner onboarding, support, and service
            operations.
          </p>
        </section>
        <section className="detail-panel legal-copy">
          <h2>Data We Collect</h2>
          <p>
            We store submitted details such as name, email, phone, city, and inquiry
            or business profile for purchase follow-up, application processing, and
            partner support.
          </p>
          <h2>How We Use Data</h2>
          <p>
            Data is used to fulfil buy and test-ride requests, evaluate dealership
            applications, and communicate about orders and service. We do not sell
            submitted data.
          </p>
          <h2>Security</h2>
          <p>
            Access is role-restricted and monitored through authenticated admin
            workflows.
          </p>
        </section>
      </main>
    </>
  )
}
