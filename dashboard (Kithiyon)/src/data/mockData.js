/**
 * mockData.js — Color constants only.
 * Attack path data, stats, and recommendations are now served by the backend.
 * See src/services/api.js for the API contract.
 */

export const severityColors = {
  HIGH:   '#f56565',
  MEDIUM: '#ed8936',
  LOW:    '#48bb78',
};

export const severityBgColors = {
  HIGH:   'rgba(245,101,101,0.15)',
  MEDIUM: 'rgba(237,137,54,0.15)',
  LOW:    'rgba(72,187,120,0.15)',
};

export const nodeTypeColors = {
  entry:     '#f56565',
  resource:  '#63b3ed',
  identity:  '#ed8936',
  sensitive: '#9f7aea',
};

export const nodeTypeLabels = {
  entry:     'ENTRY POINT',
  resource:  'CLOUD RESOURCE',
  identity:  'IDENTITY / PRIVILEGE',
  sensitive: 'SENSITIVE RESOURCE',
};
