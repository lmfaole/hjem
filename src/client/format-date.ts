export function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'nåtid';
  const [year, month] = dateString.split('-');
  if (!month) return year;
  const date = new Date(Number(year), Number(month) - 1);
  return date.toLocaleDateString('no-NO', { month: 'long', year: 'numeric' });
}
