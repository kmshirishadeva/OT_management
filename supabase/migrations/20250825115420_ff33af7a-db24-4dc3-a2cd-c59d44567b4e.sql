-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('doctor', 'admin');

-- Create enum for booking status
CREATE TYPE public.booking_status AS ENUM ('booked', 'cancelled', 'completed');

-- Create enum for specializations
CREATE TYPE public.specialization AS ENUM ('surgeon', 'orthopedic', 'neuro', 'cardiac', 'general', 'pediatric', 'gynecology', 'ent', 'ophthalmology', 'anesthesiology');

-- Create doctors table
CREATE TABLE public.doctors (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    qualification VARCHAR(255) NOT NULL,
    specialization specialization NOT NULL,
    contact VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'doctor',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patients table
CREATE TABLE public.patients (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    age INTEGER NOT NULL CHECK (age > 0 AND age < 150),
    patient_id VARCHAR(50) NOT NULL UNIQUE,
    condition TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status booking_status NOT NULL DEFAULT 'booked',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    -- Ensure end time is after start time
    CONSTRAINT check_time_order CHECK (end_time > start_time)
);

-- Enable Row Level Security
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM public.doctors WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Security definer function to get current doctor id
CREATE OR REPLACE FUNCTION public.get_current_doctor_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT id FROM public.doctors WHERE user_id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS Policies for doctors table
CREATE POLICY "Doctors can view their own profile" 
ON public.doctors 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all doctors" 
ON public.doctors 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can insert doctors" 
ON public.doctors 
FOR INSERT 
WITH CHECK (public.get_current_user_role() = 'admin');

CREATE POLICY "Admins can update doctors" 
ON public.doctors 
FOR UPDATE 
USING (public.get_current_user_role() = 'admin');

-- RLS Policies for patients table
CREATE POLICY "Authenticated users can view patients" 
ON public.patients 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert patients" 
ON public.patients 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update patients" 
ON public.patients 
FOR UPDATE 
TO authenticated
USING (true);

-- RLS Policies for bookings table
CREATE POLICY "Doctors can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (doctor_id = public.get_current_doctor_id());

CREATE POLICY "Admins can view all bookings" 
ON public.bookings 
FOR SELECT 
USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Doctors can insert their own bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK (doctor_id = public.get_current_doctor_id());

CREATE POLICY "Doctors can update their own bookings" 
ON public.bookings 
FOR UPDATE 
USING (doctor_id = public.get_current_doctor_id());

CREATE POLICY "Admins can update all bookings" 
ON public.bookings 
FOR UPDATE 
USING (public.get_current_user_role() = 'admin');

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_doctors_updated_at
    BEFORE UPDATE ON public.doctors
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
    BEFORE UPDATE ON public.patients
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create doctor profile when user signs up
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
            (NEW.raw_user_meta_data ->> 'specialization')::specialization,
            NEW.raw_user_meta_data ->> 'contact',
            COALESCE((NEW.raw_user_meta_data ->> 'role')::user_role, 'doctor')
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create doctor profile on user creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Function to check for booking conflicts
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
$$ LANGUAGE plpgsql SECURITY DEFINER;