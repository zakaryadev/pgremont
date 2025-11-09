-- Add status column to payment_records for admin approval workflow
-- Status values: pending, approved, rejected

ALTER TABLE public.payment_records 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'approved' 
CHECK (status IN ('pending','approved','rejected'));

-- Index to speed up filtering by status
CREATE INDEX IF NOT EXISTS idx_payment_records_status 
ON public.payment_records(status);

COMMENT ON COLUMN public.payment_records.status IS 'Approval status: pending (awaiting admin), approved, rejected';