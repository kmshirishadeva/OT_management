-- Update RLS policies to allow all doctors to see all bookings
DROP POLICY IF EXISTS "Doctors can view their own bookings" ON public.bookings;

-- Allow all authenticated doctors to view all bookings
CREATE POLICY "Doctors can view all bookings" 
ON public.bookings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Allow all doctors to insert bookings (but still validate doctor_id)
DROP POLICY IF EXISTS "Doctors can insert their own bookings" ON public.bookings;
CREATE POLICY "Doctors can insert bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND doctor_id = get_current_doctor_id());

-- Allow doctors to update their own bookings
DROP POLICY IF EXISTS "Doctors can update their own bookings" ON public.bookings;
CREATE POLICY "Doctors can update their own bookings" 
ON public.bookings 
FOR UPDATE 
USING (doctor_id = get_current_doctor_id());

-- Allow doctors to delete their own bookings
CREATE POLICY "Doctors can delete their own bookings" 
ON public.bookings 
FOR DELETE 
USING (doctor_id = get_current_doctor_id());

-- Update doctors table policies to allow doctors to update their own profiles
DROP POLICY IF EXISTS "Doctors can view their own profile" ON public.doctors;
CREATE POLICY "Doctors can view their own profile" 
ON public.doctors 
FOR SELECT 
USING (auth.uid() = user_id OR get_current_user_role() = 'admin'::user_role);

CREATE POLICY "Doctors can update their own profile" 
ON public.doctors 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Ensure admin policies remain for full access
-- (Admin policies already exist and take precedence)