-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    state JSONB NOT NULL,
    results JSONB NOT NULL,
    materials JSONB NOT NULL,
    services JSONB NOT NULL
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
-- For now, we'll allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on orders" ON public.orders
    FOR ALL USING (true) WITH CHECK (true);
