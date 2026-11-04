const cards = [
  { label: 'Paths found',   key: 'totalPaths',    sev: 'TOTAL',    desc: 'Total identified' },
  { label: 'Critical',      key: 'criticalCount', sev: 'CRITICAL', desc: 'Fix now'          },
  { label: 'High',          key: 'highCount',     sev: 'HIGH',     desc: 'Immediate action' },
  { label: 'Medium',        key: 'mediumCount',   sev: 'MEDIUM',   desc: 'Monitor closely'  },
  { label: 'Low',           key: 'lowCount',      sev: 'LOW',      desc: 'Informational'    },
];

export default function SummaryCards({ stats }) {
  return (
    <div className="stats" role="list" aria-label="Summary">
      {cards.map((card, i) => (
        <div
          key={card.key}
          role="listitem"
          className="stat enter"
          data-sev={card.sev}
          style={{ '--i': i + 1 }}
        >
          <div className="stat__label">
            <span className="stat__dot" aria-hidden="true" />
            {card.label}
          </div>
          <div className="stat__value">{stats[card.key] ?? 0}</div>
          <div className="stat__hint">{card.desc}</div>
        </div>
      ))}
    </div>
  );
}
