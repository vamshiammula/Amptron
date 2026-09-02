import messageSquare from '../assets/icons/message-square.svg'

const quotes = [
  {
    name: 'Rajesh Mehta',
    place: 'Ahmedabad, Gujarat',
    company: 'Apex EV Showroom',
    quote:
      '"The service and spare support from Amptron is phenomenal. Warranty approvals are completed inside 24 hours. Customers absolutely love the ride quality of Amptron Storm."',
  },
  {
    name: 'Sanjay Krishnan',
    place: 'Chennai, Tamil Nadu',
    company: 'GreenDrive Mobility',
    quote:
      '"Amptron offered the easiest ARAI compliance transition for our customers. The margins are highly profitable, and the team provided fantastic support for our high-profile launch."',
  },
  {
    name: 'Amit Kowshik',
    place: 'Bengaluru, Karnataka',
    company: 'Kowshik E-Motors',
    quote:
      '"Our showroom has scaled from selling 10 units to over 80 units a month with Amptron. The Swappable Battery Pack technology has become a true local market bestseller."',
  },
]

export default function Testimonials() {
  return (
    <section className="quotes" id="testimonials">
      <header className="section-header">
        <div className="eyebrow">
          <span className="eyebrow-bar" />
          Partners Voice
        </div>
        <h2 className="section-title">What Our Dealers Say</h2>
        <p className="section-sub">
          Real growth accounts from registered Amptron multi-state dealers.
        </p>
      </header>
      <div className="quote-grid">
        {quotes.map((item) => (
          <blockquote className="quote" key={item.name}>
            <img src={messageSquare} alt="" width={32} height={32} />
            <p>{item.quote}</p>
            <footer>
              <cite>{item.name}</cite>
              <small>
                {item.company} — <b>{item.place}</b>
              </small>
            </footer>
          </blockquote>
        ))}
      </div>
    </section>
  )
}
