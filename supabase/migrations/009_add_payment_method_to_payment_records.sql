-- Add payment_method column to payment_records table
-- This migration adds support for tracking payment methods (cash, click, transfer)

-- Step 1: Add the payment_method column with default value
ALTER TABLE public.payment_records 
ADD COLUMN payment_method VARCHAR(20) DEFAULT 'cash';

-- Step 2: Update existing records to have 'cash' as default
UPDATE public.payment_records 
SET payment_method = 'cash' 
WHERE payment_method IS NULL;

-- Step 3: Add constraint to ensure valid values
ALTER TABLE public.payment_records 
ADD CONSTRAINT check_payment_method 
CHECK (payment_method IN ('cash', 'click', 'transfer'));

-- Step 4: Make the column NOT NULL after setting defaults
ALTER TABLE public.payment_records 
ALTER COLUMN payment_method SET NOT NULL;

-- Step 5: Create index for better performance on payment_method queries
CREATE INDEX IF NOT EXISTS idx_payment_records_payment_method 
ON public.payment_records(payment_method);

-- Step 6: Add comment for documentation
COMMENT ON COLUMN public.payment_records.payment_method IS 'Payment method: cash, click, or transfer';

-- Verify the changes
DO $$
BEGIN
    -- Check if column exists and has correct properties
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'payment_records' 
        AND column_name = 'payment_method'
        AND data_type = 'character varying'
        AND is_nullable = 'NO'
    ) THEN
        RAISE NOTICE 'payment_method column added successfully';
    ELSE
        RAISE EXCEPTION 'Failed to add payment_method column';
    END IF;
END $$;
