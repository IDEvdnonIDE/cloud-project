const FRACTIONS = [
  [0.25, '¼'],
  [0.333, '⅓'],
  [0.5, '½'],
  [0.667, '⅔'],
  [0.75, '¾'],
];

/** 75 -> "1 h 15 min" */
export function formatTime(minutes) {
  const m = Math.round(Number(minutes) || 0);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} h ${rest} min` : `${h} h`;
}

/** 1.5 -> "1½", 0.25 -> "¼", null -> "" */
export function formatQty(value) {
  if (value === null || value === undefined || value === '') return '';
  const v = Number(value);
  if (!Number.isFinite(v)) return '';
  let whole = Math.floor(v);
  let frac = v - whole;
  if (frac > 0.95) {
    whole += 1;
    frac = 0;
  }
  if (frac < 0.05) return String(whole);
  const match = FRACTIONS.find(([f]) => Math.abs(frac - f) < 0.04);
  if (match) return `${whole > 0 ? whole : ''}${match[1]}`;
  return String(Math.round(v * 10) / 10);
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function timeAgo(iso) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(iso);
}

export function truncate(text = '', length = 90) {
  return text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
}

/** Props for a react-bootstrap <Badge> that colours a difficulty level. */
export function difficultyBadge(difficulty) {
  if (difficulty === 'Hard') return { bg: 'danger' };
  if (difficulty === 'Medium') return { bg: 'warning', text: 'dark' };
  return { bg: 'success' };
}

export const uid = (prefix = '') => `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
