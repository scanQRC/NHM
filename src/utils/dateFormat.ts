const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function formatArchiveMonthLabel(monthKey: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(monthKey.trim());
  if (!match) return monthKey;
  const year = match[1];
  const monthIdx = Number(match[2]) - 1;
  const monthName = MONTH_NAMES[monthIdx];
  return monthName ? `${monthName} ${year}` : monthKey;
}
