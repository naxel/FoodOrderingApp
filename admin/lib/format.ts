export const priceFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const dateFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Kyiv',
});
