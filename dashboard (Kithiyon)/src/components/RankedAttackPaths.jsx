import { useRef } from 'react';
import { severityOf } from '../data/mockData';

function hopLabel(hops) {
  return `${hops} hop${hops !== 1 ? 's' : ''}`;
}

export default function RankedAttackPaths({ paths, selectedPathId, onSelectPath }) {
  const rowRefs = useRef(new Map());
  const hasPaths = Boolean(paths && paths.length);
  const selectedInList = hasPaths && paths.some((p) => p.id === selectedPathId);

  // Arrow keys move the selection and focus together, like a native listbox.
  const handleKeyDown = (e) => {
    if (!hasPaths) return;
    const idx = paths.findIndex((p) => p.id === selectedPathId);
    const last = paths.length - 1;
    const next = {
      ArrowDown: Math.min(last, idx + 1),
      ArrowUp: Math.max(0, idx - 1),
      Home: 0,
      End: last,
    }[e.key];
    if (next === undefined) return;

    e.preventDefault();
    const target = paths[next];
    onSelectPath(target.id);
    rowRefs.current.get(target.id)?.focus();
  };

  return (
    <section className="panel panel--list">
      <header className="panel__head">
        <h2 className="panel__title">Ranked Attack Paths</h2>
        {paths && (
          <span className="count">
            {paths.length} result{paths.length !== 1 ? 's' : ''}
          </span>
        )}
      </header>

      <div
        className="paths"
        role="listbox"
        aria-label="Ranked attack paths"
        onKeyDown={handleKeyDown}
      >
        {!hasPaths ? (
          <div className="empty">
            <div className="empty__icon" aria-hidden="true">🔍</div>
            No attack paths match the current filters.
          </div>
        ) : (
          paths.map((path, idx) => {
            const selected = path.id === selectedPathId;
            // Roving tab stop: the selected row is the one Tab lands on.
            const tabbable = selected || (!selectedInList && idx === 0);
            return (
              <div
                key={path.id}
                ref={(el) => {
                  if (el) rowRefs.current.set(path.id, el);
                  else rowRefs.current.delete(path.id);
                }}
                role="option"
                aria-selected={selected}
                tabIndex={tabbable ? 0 : -1}
                className="path"
                data-sev={severityOf(path.severity)}
                onClick={() => onSelectPath(path.id)}
              >
                <div className="path__rank">#{String(idx + 1).padStart(2, '0')}</div>
                <div className="path__score">{path.riskScore}</div>

                <div className="path__body">
                  <div className="path__title">{path.title}</div>
                  <div className="chips">
                    <span className="chip chip--mono">{hopLabel(path.hops)}</span>
                    {path.techniques.map((t, i) => (
                      <span key={i} className="chip chip--mono">{t}</span>
                    ))}
                    <span className="chip">I {path.impact} × L {path.likelihood}</span>
                  </div>
                </div>

                <span className="sev-badge path__badge">{severityOf(path.severity)}</span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
