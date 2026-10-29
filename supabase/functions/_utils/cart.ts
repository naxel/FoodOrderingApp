const SIZES = ['S', 'M', 'L', 'XL'];
const MAX_LINES = 30;
const MAX_QUANTITY = 99;
const MIN_AMOUNT = 50; // Stripe minimum for USD, in cents
const MAX_AMOUNT = 100_000; // $1,000 per order
const METADATA_VALUE_LIMIT = 500; // Stripe limit per metadata value

export type CartLine = { product_id: number; size: string; quantity: number };

export class CartError extends Error {}

export const parseCart = (items: unknown): CartLine[] => {
  if (!Array.isArray(items) || items.length === 0) throw new CartError('Cart is empty');
  if (items.length > MAX_LINES) throw new CartError('Too many items in cart');

  return items.map((item) => {
    const { product_id, size, quantity } = (item ?? {}) as Record<string, unknown>;
    if (
      !Number.isInteger(product_id) ||
      !SIZES.includes(size as string) ||
      !Number.isInteger(quantity) ||
      (quantity as number) < 1 ||
      (quantity as number) > MAX_QUANTITY
    ) {
      throw new CartError('Invalid cart item');
    }
    return { product_id, size, quantity } as CartLine;
  });
};

// Prices always come from the database, never from the client
// deno-lint-ignore no-explicit-any
export const priceCart = async (supabase: { from: (table: string) => any }, cart: CartLine[]) => {
  const ids = [...new Set(cart.map((line) => line.product_id))];
  const { data, error } = await supabase
    .from('products')
    .select('id, price')
    .in('id', ids)
    .is('archived_at', null);
  if (error) throw error;

  const products = data as { id: number; price: number }[];
  const priceById = new Map(products.map((p) => [p.id, p.price]));
  const amount = cart.reduce((sum, line) => {
    const price = priceById.get(line.product_id);
    if (price == null) throw new CartError(`Unknown product ${line.product_id}`);
    return sum + Math.round(price * 100) * line.quantity;
  }, 0);

  if (amount < MIN_AMOUNT) throw new CartError('Order total is too small');
  if (amount > MAX_AMOUNT) throw new CartError('Order total is too large');
  return amount;
};

// Compact form for PaymentIntent metadata: [[product_id, size, quantity], ...]
export const encodeCart = (cart: CartLine[]): string => {
  const encoded = JSON.stringify(cart.map((l) => [l.product_id, l.size, l.quantity]));
  if (encoded.length > METADATA_VALUE_LIMIT) throw new CartError('Too many items in cart');
  return encoded;
};

export const decodeCart = (encoded: string): CartLine[] =>
  (JSON.parse(encoded) as [number, string, number][]).map(([product_id, size, quantity]) => ({
    product_id,
    size,
    quantity,
  }));
