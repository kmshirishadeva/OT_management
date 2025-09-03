-- Add new patient fields
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS gender VARCHAR(10) CHECK (gender IN ('male', 'female', 'other'));
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(255);
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medical_history TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS icu_days INTEGER DEFAULT 0;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS expected_hospital_stay INTEGER DEFAULT 1;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS insurance VARCHAR(255);
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS instruments TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS date_of_admission DATE;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS date_of_discharge DATE;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS sms_service BOOLEAN DEFAULT false;
