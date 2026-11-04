/**
 * Shared display helpers. Colours for severities and graph node types live
 * in src/index.css (data-sev / data-node tokens); components only need labels
 * and the severity normalisation below.
 * Path data comes from the API (see src/services/api.js).
 */

const KNOWN_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

/** Upper-cases and falls back to LOW, so an unexpected value never breaks styling. */
export function severityOf(value) {
  const v = String(value ?? '').toUpperCase();
  return KNOWN_SEVERITIES.includes(v) ? v : 'LOW';
}

export const nodeTypeLabels = {
  entry:     'ENTRY POINT',
  resource:  'CLOUD RESOURCE',
  identity:  'IDENTITY / PRIVILEGE',
  sensitive: 'TARGET',
};
