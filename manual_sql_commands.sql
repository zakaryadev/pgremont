-- Manual SQL commands for Supabase Dashboard
-- Copy and paste these commands in Supabase SQL Editor

-- Step 1: Add the payment_method column
ALTER TABLE payment_records 
ADD COLUMN payment_method VARCHAR(20) DEFAULT 'cash';

-- Step 2: Update existing records
UPDATE payment_records 
SET payment_method = 'cash' 
WHERE payment_method IS NULL;

-- Step 3: Add constraint
ALTER TABLE payment_records 
ADD CONSTRAINT check_payment_method 
CHECK (payment_method IN ('cash', 'click', 'transfer'));

-- Step 4: Make column NOT NULL
ALTER TABLE payment_records 
ALTER COLUMN payment_method SET NOT NULL;

-- Step 5: Create index
CREATE INDEX idx_payment_records_payment_method 
ON payment_records(payment_method);

-- Verify
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'payment_records' 
AND column_name = 'payment_method';



