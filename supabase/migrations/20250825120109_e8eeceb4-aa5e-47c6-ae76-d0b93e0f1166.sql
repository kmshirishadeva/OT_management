-- Fix function search path security issues

-- Update get_current_user_role function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM public.doctors WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, auth;

-- Update get_current_doctor_id function
CREATE OR REPLACE FUNCTION public.get_current_doctor_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM public.doctors WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public, auth;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create doctor profile if metadata contains doctor info
    IF NEW.raw_user_meta_data ? 'employee_id' THEN
        INSERT INTO public.doctors (
            user_id,
            employee_id,
            name,
            qualification,
            specialization,
            contact,
            role
        ) VALUES (
            NEW.id,
            NEW.raw_user_meta_data ->> 'employee_id',
            NEW.raw_user_meta_data ->> 'name',
            NEW.raw_user_meta_data ->> 'qualification',
            (NEW.raw_user_meta_data ->> 'specialization')::public.specialization,
            NEW.raw_user_meta_data ->> 'contact',
            COALESCE((NEW.raw_user_meta_data ->> 'role')::public.user_role, 'doctor')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update check_booking_conflict function
CREATE OR REPLACE FUNCTION public.check_booking_conflict(
    p_booking_date DATE,
    p_start_time TIME,
    p_end_time TIME,
    p_booking_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.bookings
        WHERE booking_date = p_booking_date
        AND status = 'booked'
        AND (p_booking_id IS NULL OR id != p_booking_id)
        AND (
            (start_time <= p_start_time AND end_time > p_start_time)
            OR (start_time < p_end_time AND end_time >= p_end_time)
            OR (start_time >= p_start_time AND end_time <= p_end_time)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;