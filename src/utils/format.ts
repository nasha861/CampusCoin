export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

export function formatDate(isoDate: string): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date(isoDate));
}

export function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(year, (monthNumber ?? 1) - 1),
  );
}
