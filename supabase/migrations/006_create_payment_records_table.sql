-- Create payment_records table for tracking individual payments
CREATE TABLE IF NOT EXISTS public.payment_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES public.customer_orders(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('advance', 'payment')),
    description TEXT,
    payment_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_records_order_id ON public.payment_records(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_date ON public.payment_records(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_type ON public.payment_records(payment_type);

-- Enable Row Level Security (RLS)
ALTER TABLE public.payment_records ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated users
CREATE POLICY "Allow all operations on payment_records" ON public.payment_records
    FOR ALL USING (true) WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_payment_records_updated_at 
    BEFORE UPDATE ON public.payment_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_payment_records_updated_at();
