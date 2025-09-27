-- Add calculator_type column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS calculator_type TEXT DEFAULT 'polygraphy';

-- Create index for better performance on calculator_type filtering
CREATE INDEX IF NOT EXISTS idx_orders_calculator_type ON public.orders(calculator_type);

-- Update existing orders to have polygraphy as default calculator type
UPDATE public.orders 
SET calculator_type = 'polygraphy' 
WHERE calculator_type IS NULL;
