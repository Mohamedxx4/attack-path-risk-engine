import { useState } from 'react';

const severityFilters = [
  { label: 'All',      value: 'ALL',      color: 'var(--blue)' },
  { label: 'Critical', value: 'CRITICAL', color: 'var(--pink)' },
  { label: 'High',     value: 'HIGH',     color: 'var(--red)' },
  { label: 'Medium',   value: 'MEDIUM',   color: 'var(--orange)' },
  { label: 'Low',      value: 'LOW',      color: 'var(--green)' },
];

export default function SearchBar({ filters, onFilterChange, onSearch }) {
  const [query, setQuery] = useState('');

  const handleSearch = (e) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  };

  const activeIndex = Math.max(
    0,
    severityFilters.findIndex((f) => f.value === filters.severity),
  );
  const activeColor = severityFilters[activeIndex].color;

  return (
    <div className="toolbar">
      <div className="search">
        <svg className="search__icon" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          aria-label="Search attack paths"
          placeholder="Search attack paths, techniques…"
          value={query}
          onChange={handleSearch}
        />
      </div>

      <div
        className="segmented"
        role="group"
        aria-label="Filter by severity"
        style={{ '--count': severityFilters.length, '--seg': activeColor }}
      >
        <span
          className="segmented__thumb"
          aria-hidden="true"
          style={{ '--idx': activeIndex }}
        />
        {severityFilters.map((f) => {
          const active = filters.severity === f.value;
          return (
            <button
              key={f.value}
              type="button"
              className="segment"
              aria-pressed={active}
              onClick={() => onFilterChange({ ...filters, severity: f.value })}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        className="btn"
        onClick={() =>
          onFilterChange({
            ...filters,
            sortBy: filters.sortBy === 'riskScore' ? 'impact' : 'riskScore',
          })
        }
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
          <path d="M5.5 1V10M5.5 1L2.5 4.5M5.5 1L8.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Sort: {filters.sortBy === 'riskScore' ? 'Risk Score' : 'Impact'}
      </button>
    </div>
  );
}
