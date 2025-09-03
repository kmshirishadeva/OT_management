-- Fix RLS policies to allow all doctors to see all bookings
DROP POLICY IF EXISTS "Doctors can view all bookings" ON public.bookings;

-- Create new policy allowing all authenticated users to view all bookings
CREATE POLICY "All authenticated users can view bookings" 
ON public.bookings 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Allow admins to insert admin profiles
CREATE POLICY "Admins can insert their own profile" 
ON public.admins 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);