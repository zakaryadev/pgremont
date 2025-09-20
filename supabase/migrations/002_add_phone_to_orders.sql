-- Add phone column to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add index for phone number searches
CREATE INDEX IF NOT EXISTS idx_orders_phone ON public.orders(phone);
