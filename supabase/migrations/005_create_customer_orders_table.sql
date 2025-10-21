-- Create customer_orders table for other services
CREATE TABLE IF NOT EXISTS public.customer_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    phone_number TEXT,
    total_amount DECIMAL(15,2) NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('cash', 'click', 'transfer')),
    advance_payment DECIMAL(15,2) DEFAULT 0,
    remaining_balance DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customer_orders_created_at ON public.customer_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_customer_orders_customer_name ON public.customer_orders(customer_name);
CREATE INDEX IF NOT EXISTS idx_customer_orders_phone_number ON public.customer_orders(phone_number);

-- Enable Row Level Security (RLS)
ALTER TABLE public.customer_orders ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations on customer_orders" ON public.customer_orders
    FOR ALL USING (true) WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_customer_orders_updated_at 
    BEFORE UPDATE ON public.customer_orders 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
