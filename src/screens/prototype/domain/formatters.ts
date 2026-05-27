export function formatFCFA(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} FCFA`;
}

export function formatCompactFCFA(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1000000) return `${(value / 1000000).toFixed(abs >= 10000000 ? 0 : 1)}M`;
  if (abs >= 1000) return `${Math.round(value / 1000)}K`;
  return Math.round(value).toLocaleString('fr-FR');
}
