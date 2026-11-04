/**
 * Shared colour constants for severities and graph node types.
 * Path data comes from the API (see src/services/api.js).
 */

export const severityStyles = {
  CRITICAL: { color: '#e53e8a', bg: 'rgba(229,62,138,0.13)', border: 'rgba(229,62,138,0.30)', glow: 'rgba(229,62,138,0.22)' },
  HIGH:     { color: '#f56565', bg: 'rgba(245,101,101,0.13)', border: 'rgba(245,101,101,0.25)', glow: 'rgba(245,101,101,0.22)' },
  MEDIUM:   { color: '#ed8936', bg: 'rgba(237,137,54,0.13)',  border: 'rgba(237,137,54,0.25)',  glow: 'rgba(237,137,54,0.22)' },
  LOW:      { color: '#48bb78', bg: 'rgba(72,187,120,0.13)',  border: 'rgba(72,187,120,0.25)',  glow: 'rgba(72,187,120,0.22)' },
};

export const nodeTypeLabels = {
  entry:     'ENTRY POINT',
  resource:  'CLOUD RESOURCE',
  identity:  'IDENTITY / PRIVILEGE',
  sensitive: 'TARGET',
};
