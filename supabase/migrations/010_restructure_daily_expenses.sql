-- Restructure daily_expenses table to match customer_orders structure
-- This migration adds payment_type, advance_payment, remaining_balance
-- and creates expense_payment_records pivot table for payment history

-- Step 1: Add new columns to daily_expenses
ALTER TABLE public.daily_expenses 
ADD COLUMN IF NOT EXISTS payment_type TEXT CHECK (payment_type IN ('cash', 'click', 'transfer')),
ADD COLUMN IF NOT EXISTS advance_payment NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC DEFAULT 0;

-- Step 2: Migrate existing data
-- For existing records, calculate advance_payment from cash + click + transfer
-- Set payment_type to 'cash' as default (can be updated later if needed)
UPDATE public.daily_expenses 
SET 
  advance_payment = COALESCE(cash, 0) + COALESCE(click, 0) + COALESCE(transfer, 0),
  remaining_balance = GREATEST(0, COALESCE(amount, 0) - (COALESCE(cash, 0) + COALESCE(click, 0) + COALESCE(transfer, 0))),
  payment_type = 'cash'
WHERE payment_type IS NULL;

-- Step 3: Make payment_type NOT NULL after setting defaults
ALTER TABLE public.daily_expenses 
ALTER COLUMN payment_type SET NOT NULL,
ALTER COLUMN advance_payment SET NOT NULL,
ALTER COLUMN remaining_balance SET NOT NULL;

-- Step 4: Add constraint to ensure advance_payment and remaining_balance are non-negative
ALTER TABLE public.daily_expenses 
ADD CONSTRAINT chk_advance_payment_non_negative CHECK (advance_payment >= 0),
ADD CONSTRAINT chk_remaining_balance_non_negative CHECK (remaining_balance >= 0);

-- Step 5: Create expense_payment_records table for payment history
CREATE TABLE IF NOT EXISTS public.expense_payment_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    expense_id UUID NOT NULL REFERENCES public.daily_expenses(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL,
    payment_type TEXT NOT NULL CHECK (payment_type IN ('advance', 'payment')),
    description TEXT,
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method TEXT CHECK (payment_method IN ('cash', 'click', 'transfer')) DEFAULT 'cash',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 6: Create indexes for expense_payment_records
CREATE INDEX IF NOT EXISTS idx_expense_payment_records_expense_id ON public.expense_payment_records(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_payment_records_payment_date ON public.expense_payment_records(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_expense_payment_records_payment_type ON public.expense_payment_records(payment_type);
CREATE INDEX IF NOT EXISTS idx_expense_payment_records_payment_method ON public.expense_payment_records(payment_method);

-- Step 7: Enable RLS for expense_payment_records
ALTER TABLE public.expense_payment_records ENABLE ROW LEVEL SECURITY;

-- Step 8: Create policy for expense_payment_records
CREATE POLICY "Allow all operations on expense_payment_records" ON public.expense_payment_records
    FOR ALL USING (true) WITH CHECK (true);

-- Step 9: Create trigger for expense_payment_records updated_at
CREATE OR REPLACE FUNCTION update_expense_payment_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_expense_payment_records_updated_at 
    BEFORE UPDATE ON public.expense_payment_records 
    FOR EACH ROW 
    EXECUTE FUNCTION update_expense_payment_records_updated_at();

-- Step 10: Migrate existing payment data to expense_payment_records
-- Create payment records for existing expenses that have payments
INSERT INTO public.expense_payment_records (expense_id, amount, payment_type, description, payment_date, payment_method)
SELECT 
    id as expense_id,
    (COALESCE(cash, 0) + COALESCE(click, 0) + COALESCE(transfer, 0)) as amount,
    'advance' as payment_type,
    'Migrated from existing payment data' as description,
    created_at::DATE as payment_date,
    CASE 
        WHEN COALESCE(click, 0) > 0 THEN 'click'
        WHEN COALESCE(transfer, 0) > 0 THEN 'transfer'
        ELSE 'cash'
    END as payment_method
FROM public.daily_expenses
WHERE (COALESCE(cash, 0) + COALESCE(click, 0) + COALESCE(transfer, 0)) > 0;

-- Note: We keep cash, click, transfer columns for now to avoid breaking existing code
-- They can be dropped in a future migration after confirming everything works




