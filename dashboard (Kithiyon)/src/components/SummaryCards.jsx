const cards = [
  { label: 'Paths Found',   key: 'totalPaths',    sev: 'TOTAL',    desc: 'Total identified' },
  { label: 'Critical Risk', key: 'criticalCount', sev: 'CRITICAL', desc: 'Fix now'          },
  { label: 'High Risk',     key: 'highCount',     sev: 'HIGH',     desc: 'Immediate action' },
  { label: 'Medium Risk',   key: 'mediumCount',   sev: 'MEDIUM',   desc: 'Monitor closely'  },
  { label: 'Low Risk',      key: 'lowCount',      sev: 'LOW',      desc: 'Informational'    },
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
          style={{ '--i': i }}
        >
          <div className="stat__label">{card.label}</div>
          <div className="stat__value">{stats[card.key] ?? 0}</div>
          <div className="stat__hint">{card.desc}</div>
        </div>
      ))}
    </div>
  );
}
