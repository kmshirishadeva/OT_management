import { useState } from 'react'
import { PatientSelection } from './PatientSelection'
import { PatientForm } from './PatientForm'
import { PatientConfirmation } from './PatientConfirmation'
import { BookingForm } from '../booking/BookingForm'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Patient {
  id: string
  name: string
  age: number
  patient_id: string
  gender: string | null
  emergency_contact: string | null
  condition: string
  medical_history: string | null
  icu_days: number | null
  expected_hospital_stay: number | null
  insurance: string | null
  instruments: string | null
  date_of_admission: string | null
  date_of_discharge: string | null
  sms_service: boolean | null
}

interface PatientManagementProps {
  selectedDate?: Date
  onCancel?: () => void
  onBookingCreated?: () => void
}

export const PatientManagement = ({ selectedDate, onCancel, onBookingCreated }: PatientManagementProps) => {
  const [currentStep, setCurrentStep] = useState<'select' | 'add-patient' | 'confirm' | 'book-slot'>('select')
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  // Debug logging
  console.log('PatientManagement state:', { currentStep, selectedPatient, selectedDate })

  const handlePatientSelected = (patient: Patient) => {
    setSelectedPatient(patient)
    setCurrentStep('confirm')
  }

  const handlePatientCreated = (patient: Patient) => {
    setSelectedPatient(patient)
    setCurrentStep('confirm')
  }

  const handlePatientConfirmed = () => {
    console.log('Patient confirmed, moving to book-slot step')
    console.log('Current selectedPatient:', selectedPatient)
    console.log('Current selectedDate:', selectedDate)
    setCurrentStep('book-slot')
  }

  const handleBookingCreated = () => {
    console.log('PatientManagement: handleBookingCreated called')
    // Reset and go back to main view
    setCurrentStep('select')
    setSelectedPatient(null)
    // Call the proper callback to refresh the calendar
    console.log('PatientManagement: calling onBookingCreated callback')
    onBookingCreated?.()
  }

  const handleChangePatient = () => {
    setCurrentStep('select')
  }

  // Step 1: Patient Selection
  if (currentStep === 'select') {
    return (
      <PatientSelection
        onPatientSelected={handlePatientSelected}
        onAddPatient={() => setCurrentStep('add-patient')}
        onCancel={onCancel}
      />
    )
  }

  // Step 2: Add Patient Form
  if (currentStep === 'add-patient') {
    return (
      <PatientForm
        onPatientCreated={handlePatientCreated}
        onCancel={() => setCurrentStep('select')}
      />
    )
  }

  // Step 3: Patient Confirmation
  if (currentStep === 'confirm' && selectedPatient) {
    return (
      <PatientConfirmation
        patient={selectedPatient}
        onConfirm={handlePatientConfirmed}
        onChangePatient={handleChangePatient}
        onCancel={onCancel}
      />
    )
  }

  // Step 4: Booking Form
  if (currentStep === 'book-slot' && selectedPatient) {
    console.log('Rendering BookingForm with:', { selectedDate, selectedPatient })
    try {
      return (
        <BookingForm
          selectedDate={selectedDate}
          selectedPatient={selectedPatient}
          onBookingCreated={handleBookingCreated}
          onCancel={() => setCurrentStep('select')}
        />
      )
    } catch (error) {
      console.error('Error rendering BookingForm:', error)
      return (
        <Card className="w-full max-w-2xl mx-auto">
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">Error loading booking form. Please try again.</p>
              <Button onClick={() => setCurrentStep('select')} variant="outline">
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }
  }

  // Fallback - should not reach here
  return (
    <div className="text-center py-8">
      <p className="text-muted-foreground">Something went wrong. Please try again.</p>
      <button 
        onClick={() => setCurrentStep('select')}
        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md"
      >
        Start Over
      </button>
    </div>
  )
}
