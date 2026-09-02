import Seo from '../components/Seo'

export default function TermsPage() {
  return (
    <>
      <Seo
        title="Amptron Terms of Service"
        description="Terms governing use of Amptron's website, purchase requests, partner workflows, and support portal."
        path="/terms"
      />
      <main id="main" className="content-page narrow-page">
        <section className="content-hero">
          <h1>Terms of Service</h1>
          <p>
            These terms apply to riders, visitors, applicants, and registered
            partner users using Amptron online services.
          </p>
        </section>
        <section className="detail-panel legal-copy">
          <h2>Portal Access</h2>
          <p>
            Dealer portal credentials are individual and must not be shared. Amptron
            may suspend access in case of misuse.
          </p>
          <h2>Purchase and Application Accuracy</h2>
          <p>
            Buy requests and dealer applications must include accurate contact
            details. False submissions may be rejected without notice.
          </p>
          <h2>Support Response</h2>
          <p>
            Service-level commitments in signed sales or dealership agreements
            override website-level descriptions.
          </p>
        </section>
      </main>
    </>
  )
}
