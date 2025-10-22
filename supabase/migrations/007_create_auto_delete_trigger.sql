-- Create function to check if order is fully paid and auto-delete
CREATE OR REPLACE FUNCTION check_and_delete_fully_paid_orders()
RETURNS TRIGGER AS $$
DECLARE
    total_paid DECIMAL(15,2);
    order_total DECIMAL(15,2);
    order_exists BOOLEAN;
BEGIN
    -- Check if the order still exists (it might have been deleted already)
    SELECT EXISTS(SELECT 1 FROM customer_orders WHERE id = NEW.order_id) INTO order_exists;
    
    IF NOT order_exists THEN
        RETURN NEW;
    END IF;
    
    -- Get the order total amount
    SELECT total_amount INTO order_total
    FROM customer_orders
    WHERE id = NEW.order_id;
    
    -- Calculate total paid amount: original advance + payment records
    SELECT 
        (SELECT advance_payment FROM customer_orders WHERE id = NEW.order_id) +
        COALESCE(SUM(amount), 0)
    INTO total_paid
    FROM payment_records
    WHERE order_id = NEW.order_id;
    
    -- If fully paid (total_paid >= order_total), delete the order
    IF total_paid >= order_total THEN
        -- Delete payment records first (due to foreign key constraint)
        DELETE FROM payment_records WHERE order_id = NEW.order_id;
        
        -- Delete the order
        DELETE FROM customer_orders WHERE id = NEW.order_id;
        
        -- Log the deletion (optional)
        RAISE NOTICE 'Order % was fully paid and automatically deleted', NEW.order_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after payment record is inserted/updated
CREATE TRIGGER auto_delete_fully_paid_orders_trigger
    AFTER INSERT OR UPDATE ON payment_records
    FOR EACH ROW
    EXECUTE FUNCTION check_and_delete_fully_paid_orders();

-- Also create a trigger for when customer_orders is updated directly
CREATE OR REPLACE FUNCTION check_and_delete_on_order_update()
RETURNS TRIGGER AS $$
DECLARE
    total_paid DECIMAL(15,2);
BEGIN
    -- Calculate total paid amount: original advance + payment records
    SELECT 
        NEW.advance_payment +
        COALESCE(SUM(amount), 0)
    INTO total_paid
    FROM payment_records
    WHERE order_id = NEW.id;
    
    -- If fully paid (total_paid >= order_total), delete the order
    IF total_paid >= NEW.total_amount THEN
        -- Delete payment records first
        DELETE FROM payment_records WHERE order_id = NEW.id;
        
        -- Delete the order
        DELETE FROM customer_orders WHERE id = NEW.id;
        
        RAISE NOTICE 'Order % was fully paid and automatically deleted', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_delete_on_order_update_trigger
    AFTER UPDATE ON customer_orders
    FOR EACH ROW
    EXECUTE FUNCTION check_and_delete_on_order_update();
