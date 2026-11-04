import { useState } from 'react';
import { nodeTypeLabels } from '../data/mockData';

const nodeIcons = {
  entry: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="3" fill="currentColor" />
      <path d="M9 2V5M9 13V16M2 9H5M13 9H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  resource: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="12" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M6 8H12M6 11H9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  ),
  identity: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M3 16C3 12.686 5.686 10 9 10C12.314 10 15 12.686 15 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  ),
  sensitive: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="4" y="8" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M6 8V5C6 3.343 7.343 2 9 2C10.657 2 12 3.343 12 5V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="9" cy="12" r="1" fill="currentColor" />
    </svg>
  ),
};

/** The connector between two steps: a growing line, the action chip, and a chevron. */
function Edge({ next, index, open, onToggle }) {
  const label = next.action || (next.mechanism ? 'why' : null);
  const explainable = Boolean(next.mechanism);
  const whyId = `${next.id}-why`;

  return (
    <div className="edge" style={{ '--i': index }}>
      <div className="edge__line" aria-hidden="true" />

      {label &&
        (explainable ? (
          <button
            type="button"
            className="edge__chip"
            aria-expanded={open}
            aria-controls={whyId}
            onClick={onToggle}
          >
            {label}
          </button>
        ) : (
          <span className="edge__chip edge__chip--static">{label}</span>
        ))}

      {open && explainable && (
        <p id={whyId} className="edge__why">{next.mechanism}</p>
      )}

      <svg className="edge__chev" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
        <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function PathGraphView({ path }) {
  // Which connector's explanation is open. The parent keys this component by
  // path id, so the state resets when a different path is selected.
  const [openEdge, setOpenEdge] = useState(null);

  return (
    <section className="panel">
      <header className="panel__head">
        <h2 className="panel__title">Path Graph View</h2>
        {path && <span className="count count--mono">{path.nodes.length} nodes</span>}
      </header>

      {!path ? (
        <div className="empty empty--graph">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ margin: '0 auto 12px', display: 'block' }} aria-hidden="true">
            <circle cx="18" cy="9" r="4" stroke="rgba(99,179,237,0.25)" strokeWidth="1.5" fill="none" />
            <circle cx="18" cy="27" r="4" stroke="rgba(99,179,237,0.25)" strokeWidth="1.5" fill="none" />
            <path d="M18 13V23" stroke="rgba(99,179,237,0.20)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
          </svg>
          Select an attack path to view its graph
        </div>
      ) : (
        <>
          <ol className="graph" aria-label="Attack path steps">
            {path.nodes.map((node, i) => {
              const next = path.nodes[i + 1];
              return (
                <li key={node.id} className="graph__step" style={{ '--i': i }}>
                  <div className="node" data-node={node.type}>
                    <div className="node__disc">{nodeIcons[node.type] ?? nodeIcons.resource}</div>
                    <div className="node__label" title={node.arn || undefined}>{node.label}</div>
                    {node.kind && <div className="node__kind">{node.kind}</div>}
                    <div className="node__tag">{nodeTypeLabels[node.type]}</div>
                  </div>

                  {next && (
                    <Edge
                      next={next}
                      index={i}
                      open={openEdge === next.id}
                      onToggle={() => setOpenEdge((cur) => (cur === next.id ? null : next.id))}
                    />
                  )}
                </li>
              );
            })}
          </ol>

          <div className="graph__foot">
            {path.hops} hop{path.hops !== 1 ? 's' : ''} · tap a step to see why it works
          </div>
        </>
      )}
    </section>
  );
}
