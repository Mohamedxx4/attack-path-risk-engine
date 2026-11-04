import { useState } from 'react';

const severityFilters = [
  { label: 'All',      value: 'ALL',      color: '#63b3ed' },
  { label: 'Critical', value: 'CRITICAL', color: '#e53e8a' },
  { label: 'High',   value: 'HIGH',   color: '#f56565' },
  { label: 'Medium', value: 'MEDIUM', color: '#ed8936' },
  { label: 'Low',    value: 'LOW',    color: '#48bb78' },
];

const S = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginTop: 18,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  searchWrap: {
    flex: 1,
    minWidth: 220,
    position: 'relative',
  },
  searchInput: {
    width: '100%',
    padding: '9px 14px 9px 38px',
    fontSize: 13,
    border: '1px solid rgba(99,179,237,0.14)',
    borderRadius: 10,
    outline: 'none',
    fontFamily: 'Inter, sans-serif',
    background: 'rgba(17,31,53,0.9)',
    color: '#e2eaf4',
    transition: 'border-color 0.18s, box-shadow 0.18s',
    letterSpacing: '0.01em',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#4d6278',
    pointerEvents: 'none',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'rgba(17,31,53,0.8)',
    border: '1px solid rgba(99,179,237,0.10)',
    borderRadius: 10,
    padding: '4px 6px',
  },
  sortBtn: {
    padding: '7px 14px',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    borderRadius: 8,
    border: '1px solid rgba(99,179,237,0.14)',
    background: 'rgba(17,31,53,0.9)',
    color: '#8fa5c0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontFamily: 'Inter, sans-serif',
    transition: 'all 0.18s ease',
  },
};

export default function SearchBar({ filters, onFilterChange, onSearch }) {
  const [searchVal, setSearchVal] = useState('');
  const [focused, setFocused] = useState(false);

  const handleSearch = (e) => {
    setSearchVal(e.target.value);
    onSearch(e.target.value);
  };

  return (
    <div style={S.container}>
      {/* Search */}
      <div style={S.searchWrap}>
        <svg style={S.searchIcon} width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          style={{
            ...S.searchInput,
            borderColor: focused ? 'rgba(99,179,237,0.38)' : 'rgba(99,179,237,0.14)',
            boxShadow: focused ? '0 0 0 3px rgba(99,179,237,0.08)' : 'none',
          }}
          type="text"
          placeholder="Search attack paths, techniques…"
          value={searchVal}
          onChange={handleSearch}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </div>

      {/* Severity filters */}
      <div style={S.filterGroup}>
        {severityFilters.map((f) => {
          const active = filters.severity === f.value;
          return (
            <button
              key={f.value}
              style={{
                padding: '5px 13px',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                borderRadius: 7,
                border: active ? `1px solid ${f.color}40` : '1px solid transparent',
                background: active ? `${f.color}1a` : 'transparent',
                color: active ? f.color : '#4d6278',
                cursor: 'pointer',
                transition: 'all 0.16s ease',
                fontFamily: 'Inter, sans-serif',
              }}
              onClick={() => onFilterChange({ ...filters, severity: f.value })}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Sort */}
      <button
        style={S.sortBtn}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(99,179,237,0.30)';
          e.currentTarget.style.color = '#e2eaf4';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(99,179,237,0.14)';
          e.currentTarget.style.color = '#8fa5c0';
        }}
        onClick={() =>
          onFilterChange({
            ...filters,
            sortBy: filters.sortBy === 'riskScore' ? 'impact' : 'riskScore',
          })
        }
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M5.5 1V10M5.5 1L2.5 4.5M5.5 1L8.5 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Sort: {filters.sortBy === 'riskScore' ? 'Risk Score' : 'Impact'}
      </button>
    </div>
  );
}
