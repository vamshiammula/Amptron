import Seo from '../components/Seo'

export default function WarrantyPage() {
  return (
    <>
      <Seo
        title="Amptron Warranty Policy"
        description="Amptron electric scooter warranty framework for vehicles, battery packs, and service escalation."
        path="/warranty"
      />
      <main id="main" className="content-page narrow-page">
        <section className="content-hero">
          <h1>Warranty Policy</h1>
          <p>
            Amptron supports owner and dealer warranty workflows through a
            structured claims and replacement process, whether you bought from us
            or from a partner showroom.
          </p>
        </section>
        <section className="detail-panel legal-copy">
          <h2>Vehicle Coverage</h2>
          <p>
            Vehicle components are covered as per the signed sales or dealership
            policy and model-specific terms.
          </p>
          <h2>Battery Coverage</h2>
          <p>
            Battery claims require charge-cycle and usage diagnostics validated
            through authorized service partners.
          </p>
          <h2>Escalation</h2>
          <p>
            Owners and dealers can raise support tickets for warranty escalation and
            replacement approvals.
          </p>
        </section>
      </main>
    </>
  )
}
