-- Create admins table for OT management
CREATE TABLE public.admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  contact VARCHAR NOT NULL,
  role VARCHAR NOT NULL DEFAULT 'ot_admin',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create policies for admins table
CREATE POLICY "Admins can view their own profile" 
ON public.admins 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update their own profile" 
ON public.admins 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to get current admin role
CREATE OR REPLACE FUNCTION public.get_current_admin_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
BEGIN
    RETURN (SELECT role FROM public.admins WHERE user_id = auth.uid());
END;
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public', 'auth'
AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid());
END;
$$;

-- Add operation theater tracking to bookings
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS operation_theater INTEGER DEFAULT 1 CHECK (operation_theater BETWEEN 1 AND 4);

-- Update bookings policies to allow admins full access
CREATE POLICY "Admins can view all bookings (admin table)" 
ON public.bookings 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can update all bookings (admin table)" 
ON public.bookings 
FOR UPDATE 
USING (is_admin());

CREATE POLICY "Admins can delete all bookings (admin table)" 
ON public.bookings 
FOR DELETE 
USING (is_admin());

CREATE POLICY "Admins can insert bookings (admin table)" 
ON public.bookings 
FOR INSERT 
WITH CHECK (is_admin());

-- Update doctors policies for admin access
CREATE POLICY "Admins can view all doctors (admin table)" 
ON public.doctors 
FOR SELECT 
USING (is_admin());

-- Update patients policies for admin access  
CREATE POLICY "Admins can view all patients (admin table)" 
ON public.patients 
FOR SELECT 
USING (is_admin());

-- Update handle_new_user function to support admins
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    -- Create doctor profile if metadata contains doctor info
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
    -- Create admin profile if metadata contains admin info
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