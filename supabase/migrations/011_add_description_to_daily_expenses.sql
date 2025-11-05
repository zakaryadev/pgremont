-- Add description column to daily_expenses for optional notes about the expense

ALTER TABLE public.daily_expenses
ADD COLUMN IF NOT EXISTS description TEXT;

-- Optional: comment for documentation
COMMENT ON COLUMN public.daily_expenses.description IS 'Optional description/notes for the expense record';


