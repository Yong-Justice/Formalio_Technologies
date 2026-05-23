export function calculateLoanRepayment(amount: number, rate: number, months: number) {
  const interest = amount * rate;
  return months > 0 ? (amount + interest) / months : 0;
}
