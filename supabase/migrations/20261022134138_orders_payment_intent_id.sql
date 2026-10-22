-- Link each order to the Stripe PaymentIntent that paid for it.
-- UNIQUE: one PaymentIntent can create only one order (create-order is safe to retry).
ALTER TABLE public.orders
  ADD COLUMN payment_intent_id text UNIQUE;
