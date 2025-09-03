-- Add unique constraints to prevent email/phone overlap across roles
-- First, add a unique constraint on auth.users email (this ensures no duplicate emails)

-- Add a trigger function to prevent duplicate contacts/emails across tables
CREATE OR REPLACE FUNCTION public.check_unique_contact_across_roles()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if email exists in doctors table when inserting into admins
    IF TG_TABLE_NAME = 'admins' THEN
        IF EXISTS (
            SELECT 1 FROM public.doctors 
            WHERE contact = NEW.contact 
            OR (SELECT email FROM auth.users WHERE id = user_id) = (SELECT email FROM auth.users WHERE id = NEW.user_id)
        ) THEN
            RAISE EXCEPTION 'Contact or email already exists in doctors table';
        END IF;
    END IF;
    
    -- Check if email exists in admins table when inserting into doctors
    IF TG_TABLE_NAME = 'doctors' THEN
        IF EXISTS (
            SELECT 1 FROM public.admins 
            WHERE contact = NEW.contact
            OR (SELECT email FROM auth.users WHERE id = user_id) = (SELECT email FROM auth.users WHERE id = NEW.user_id)
        ) THEN
            RAISE EXCEPTION 'Contact or email already exists in admins table';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for both tables
DROP TRIGGER IF EXISTS check_unique_contact_before_insert_doctors ON public.doctors;
CREATE TRIGGER check_unique_contact_before_insert_doctors
    BEFORE INSERT ON public.doctors
    FOR EACH ROW
    EXECUTE FUNCTION public.check_unique_contact_across_roles();

DROP TRIGGER IF EXISTS check_unique_contact_before_insert_admins ON public.admins;
CREATE TRIGGER check_unique_contact_before_insert_admins
    BEFORE INSERT ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION public.check_unique_contact_across_roles();

-- Update the handle_new_user function to properly handle role separation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = 'public'
AS $$
BEGIN
    -- Only create doctor profile if metadata contains doctor-specific info (specialization)
    IF NEW.raw_user_meta_data ? 'employee_id' AND NEW.raw_user_meta_data ? 'specialization' THEN
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
    -- Only create admin profile if metadata contains admin-specific info (admin_role)
    ELSIF NEW.raw_user_meta_data ? 'employee_id' AND NEW.raw_user_meta_data ? 'admin_role' THEN
        INSERT INTO public.admins (
            user_id,
            employee_id,
            name,
            contact,
            role
        ) VALUES (
            NEW.id,
            NEW.raw_user_meta_data ->> 'employee_id',
            NEW.raw_user_meta_data ->> 'name',
            NEW.raw_user_meta_data ->> 'contact',
            NEW.raw_user_meta_data ->> 'admin_role'
        );
    END IF;
    RETURN NEW;
END;
$$;