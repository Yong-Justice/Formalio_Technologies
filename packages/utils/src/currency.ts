export function formatCurrency(
  amount: number,
  currency = "XAF",
  locale = "fr-CM"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function calculateTax(amount: number, taxRate: number): number {
  return Math.round(amount * (taxRate / 100) * 100) / 100;
}

export function calculateTotal(
  lineItems: Array<{ quantity: number; unitPrice: number; taxRate: number }>
): { subtotal: number; taxTotal: number; total: number } {
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const taxTotal = lineItems.reduce(
    (sum, item) => sum + calculateTax(item.quantity * item.unitPrice, item.taxRate),
    0
  );
  return { subtotal, taxTotal, total: subtotal + taxTotal };
}
