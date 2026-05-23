export function formatCurrency(amount: number, currency = 'FCFA') {
  return `${Math.round(amount).toLocaleString()} ${currency}`;
}
