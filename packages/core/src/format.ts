export const priceFormat = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const priceWithoutDecimalsFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});
