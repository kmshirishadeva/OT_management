import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { Clock, User, FileText, Calendar } from 'lucide-react'



interface BookingFormProps {
  selectedDate?: Date
  selectedPatient?: any
  onBookingCreated?: () => void
  onCancel?: () => void
}

export const BookingForm = ({ selectedDate, selectedPatient, onBookingCreated, onCancel }: BookingFormProps) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Debug logging
  console.log('BookingForm rendered with:', { selectedDate, selectedPatient })

  const [bookingData, setBookingData] = useState({
    date: selectedDate || new Date(),
    startTime: '',
    endTime: '',
    patientId: selectedPatient?.id || '',
    operationTheater: 1,
    notes: ''
  })

  // Debug logging after state initialization
  console.log('Current bookingData:', bookingData)

  // Update booking data when selectedPatient changes
  useEffect(() => {
    if (selectedPatient) {
      setBookingData(prev => ({
        ...prev,
        patientId: selectedPatient.id
      }))
    }
  }, [selectedPatient])

  // Helper function to format date correctly without timezone issues
  const formatDateForDatabase = (date: Date): string => {
    console.log('formatDateForDatabase called with:', date)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const result = `${year}-${month}-${day}`
    console.log('formatDateForDatabase result:', result)
    return result
  }

  const checkConflict = async () => {
    const { data, error } = await supabase
      .rpc('check_booking_conflict', {
        p_booking_date: formatDateForDatabase(bookingData.date),
        p_start_time: bookingData.startTime,
        p_end_time: bookingData.endTime
      })

    if (error) {
      console.error('Error checking conflict:', error)
      return false
    }

    return data
  }

  const createBooking = async () => {
    console.log('Creating booking...')
    console.log('Selected date:', bookingData.date)
    console.log('Formatted date for database:', formatDateForDatabase(bookingData.date))
    setLoading(true)

    // First check for conflicts
    const hasConflict = await checkConflict()
    if (hasConflict) {
      toast({
        title: "Time Slot Conflict",
        description: "This time slot is already booked. Please select a different time.",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    // Get current doctor
    const { data: doctorData, error: doctorError } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
      .single()

    if (doctorError || !doctorData) {
      toast({
        title: "Error",
        description: "Could not find doctor profile",
        variant: "destructive",
      })
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('bookings')
      .insert([{
        doctor_id: doctorData.id,
        patient_id: bookingData.patientId,
        booking_date: formatDateForDatabase(bookingData.date),
        start_time: bookingData.startTime,
        end_time: bookingData.endTime,
        operation_theater: bookingData.operationTheater || 1,
        notes: bookingData.notes
      }])

    if (error) {
      toast({
        title: "Booking Failed",
        description: error.message || "Failed to create booking",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Booking Created",
        description: "OT slot has been successfully booked and calendar updated",
      })
      console.log('BookingForm: calling onBookingCreated callback')
      onBookingCreated?.()
    }
    
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted with data:', bookingData)
    await createBooking()
  }

  // If no patient is selected, show an error
  if (!selectedPatient) {
    console.log('No patient selected, showing error message')
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">No patient selected for booking.</p>
            <Button onClick={onCancel} variant="outline">
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  console.log('Rendering BookingForm main content')
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Book OT Slot
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date and Time */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Surgery Date</Label>
              <div className="p-3 border rounded-md bg-muted/50">
                <p className="text-sm">
                  Selected Date: {bookingData.date.toLocaleDateString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Database Format: {formatDateForDatabase(bookingData.date)}
                </p>
              </div>
              <DatePicker
                date={bookingData.date}
                onSelect={(date) => setBookingData({ ...bookingData, date: date || new Date() })}
              />
            </div>
            

            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-time">Start Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="start-time"
                    type="time"
                    value={bookingData.startTime}
                    onChange={(e) => setBookingData({ ...bookingData, startTime: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="end-time">End Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="end-time"
                    type="time"
                    value={bookingData.endTime}
                    onChange={(e) => setBookingData({ ...bookingData, endTime: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <div className="space-y-4">
            <Label>Selected Patient</Label>
            <div className="p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{selectedPatient?.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    ID: {selectedPatient?.patient_id} • Age: {selectedPatient?.age} • {selectedPatient?.condition}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Textarea
                id="notes"
                value={bookingData.notes}
                onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                placeholder="Any special requirements or notes for the surgery"
                className="pl-10"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Creating Booking..." : "Book OT Slot"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}