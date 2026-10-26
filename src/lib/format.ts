export const formatNpr = (amount: number) =>
  new Intl.NumberFormat('en-NP', {
    style: 'currency',
    currency: 'NPR',
    maximumFractionDigits: 0,
  }).format(amount).replace('NPR', 'NPR ');

export const formatDate = (date: string) =>
  new Intl.DateTimeFormat('en-NP', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(date));

export const slugify = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export const titleCase = (value: string) => value.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
