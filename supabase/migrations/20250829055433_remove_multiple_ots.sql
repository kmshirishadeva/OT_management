-- Remove multiple OTs and keep only OT 1
-- Update the operation_theater constraint to only allow value 1
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_operation_theater_check;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_operation_theater_check CHECK (operation_theater = 1);

-- Update all existing bookings to use OT 1
UPDATE public.bookings SET operation_theater = 1 WHERE operation_theater IS NULL OR operation_theater != 1;
