const stats = [
  { value: '10,000+', label: 'Scooters Assembled' },
  { value: '150+', label: 'Dealer Partners' },
  { value: '22', label: 'States & UTs Covered' },
  { value: '99.2%', label: 'Quality Pass Rate' },
]

export default function Numbers() {
  return (
    <section className="numbers" aria-label="Amptron at a glance">
      {stats.map((stat) => (
        <div key={stat.label}>
          <strong>{stat.value}</strong>
          <span>{stat.label}</span>
        </div>
      ))}
    </section>
  )
}
