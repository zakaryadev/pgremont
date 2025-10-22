-- Disable all auto-delete triggers in Supabase
-- The pg_sleep approach causes timeout errors
-- Auto-deletion will be handled by frontend with 15-second interval instead

-- Drop all existing triggers
DROP TRIGGER IF EXISTS auto_delete_fully_paid_orders_trigger ON payment_records;
DROP TRIGGER IF EXISTS auto_delete_on_order_update_trigger ON customer_orders;
DROP TRIGGER IF EXISTS auto_delete_fully_paid_orders_trigger_with_delay ON payment_records;
DROP TRIGGER IF EXISTS auto_delete_on_order_update_trigger_with_delay ON customer_orders;

-- Drop the functions
DROP FUNCTION IF EXISTS check_and_delete_fully_paid_orders();
DROP FUNCTION IF EXISTS check_and_delete_on_order_update();
DROP FUNCTION IF EXISTS check_and_delete_fully_paid_orders_with_delay();
DROP FUNCTION IF EXISTS check_and_delete_on_order_update_with_delay();

-- Note: Auto-deletion is now handled by frontend with 15-second interval
-- This prevents timeout errors and gives enough time for payment records to be saved
