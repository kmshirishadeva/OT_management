import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PatientManagement } from '@/components/patient/PatientManagement'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { format, addDays, startOfWeek, isSameDay, parseISO } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Clock, User } from 'lucide-react'

interface Booking {
  id: string
  booking_date: string
  start_time: string
  end_time: string
  status: string
  notes?: string
  operation_theater: number
  doctor_id: string
  patient: {
    name: string
    patient_id: string
    condition: string
  }
  doctor: {
    name: string
    specialization: string
    employee_id: string
  }
}

export const BookingCalendar = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [bookings, setBookings] = useState<Booking[]>([])
  const [allBookingsForStats, setAllBookingsForStats] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [showPatientManagement, setShowPatientManagement] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null)
  const [weeklyStats, setWeeklyStats] = useState({
    totalThisWeek: 0,
    totalCompleted: 0,
    totalCancelled: 0,
    totalActive: 0,
    availableDays: 0
  })


  useEffect(() => {
    getCurrentDoctorId()
  }, [])

  useEffect(() => {
    if (currentDoctorId) {
      fetchBookings()
      fetchAllBookingsForStats()
      autoCompletePastBookings()
    }
  }, [currentDoctorId])

  useEffect(() => {
    if (allBookingsForStats.length > 0) {
      calculateWeeklyStats()
    }
  }, [allBookingsForStats])

  // Recalculate stats when week changes
  useEffect(() => {
    if (allBookingsForStats.length > 0) {
      calculateWeeklyStats()
    }
  }, [currentWeek, allBookingsForStats])

  const getCurrentDoctorId = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: doctorData, error } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', user.id)
          .single()
        
        if (doctorData) {
          setCurrentDoctorId(doctorData.id)
        }
      }
    } catch (error) {
      console.error('Error getting current doctor ID:', error)
    }
  }

  // Fetch only active and completed bookings for calendar display
  const fetchBookings = async () => {
    if (!currentDoctorId) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          patient:patients(name, patient_id, condition),
          doctor:doctors(name, specialization, employee_id)
        `)
        .eq('operation_theater', 1)
        .in('status', ['booked', 'completed']) // Only show active and completed in calendar
        .order('booking_date', { ascending: true })
        .order('start_time')

      if (error) {
        console.error('Error fetching bookings:', error)
      } else {
        setBookings(data || [])
      }
    } catch (error) {
      console.error('Error in fetchBookings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch all bookings for statistics (including cancelled)
  const fetchAllBookingsForStats = async () => {
    if (!currentDoctorId) return
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          patient:patients(name, patient_id, condition),
          doctor:doctors(name, specialization, employee_id)
        `)
        .eq('operation_theater', 1)
        .in('status', ['booked', 'completed', 'cancelled']) // Include all statuses for stats
        .order('booking_date', { ascending: true })
        .order('start_time')

      if (error) {
        console.error('Error fetching all bookings for stats:', error)
      } else {
        setAllBookingsForStats(data || [])
      }
    } catch (error) {
      console.error('Error in fetchAllBookingsForStats:', error)
    }
  }

  // Auto-complete past bookings that haven't been marked as completed
  const autoCompletePastBookings = async () => {
    if (!currentDoctorId) return

    try {
      const today = new Date()
      const todayStr = format(today, 'yyyy-MM-dd')
      
      // Find all active bookings from past days
      const { data: pastBookings, error } = await supabase
        .from('bookings')
        .select('id, booking_date, status')
        .eq('doctor_id', currentDoctorId)
        .eq('status', 'booked')
        .lt('booking_date', todayStr)

      if (error) {
        console.error('Error fetching past bookings:', error)
        return
      }

      if (pastBookings && pastBookings.length > 0) {
        // Update all past bookings to completed status
        const { error: updateError } = await supabase
          .from('bookings')
          .update({ status: 'completed' })
          .in('id', pastBookings.map(b => b.id))

        if (updateError) {
          console.error('Error updating past bookings:', updateError)
        } else {
          console.log(`Auto-completed ${pastBookings.length} past bookings`)
          // Refresh both calendar and stats
          await fetchBookings()
          await fetchAllBookingsForStats()
        }
      }
    } catch (error) {
      console.error('Error in auto-complete process:', error)
    }
  }

  const calculateWeeklyStats = () => {
    // Use the currentWeek being viewed instead of always using today
    const startOfViewedWeek = startOfWeek(currentWeek)
    const endOfViewedWeek = addDays(startOfViewedWeek, 6)
    
    // Filter bookings for the specific week being viewed
    const thisWeekBookings = allBookingsForStats.filter(booking => {
      const bookingDate = new Date(booking.booking_date)
      return bookingDate >= startOfViewedWeek && bookingDate <= endOfViewedWeek
    })

    // Calculate available days for the viewed week
    const today = new Date()
    const isCurrentWeek = isSameDay(startOfWeek(today), startOfWeek(currentWeek))
    
    let availableDays = 0
    if (isCurrentWeek) {
      // If viewing current week, calculate remaining days including today
      const daysInWeek = 7
      const currentDayOfWeek = today.getDay() // 0 = Sunday, 1 = Monday, etc.
      const remainingDays = daysInWeek - currentDayOfWeek
      availableDays = Math.max(0, remainingDays)
    } else if (currentWeek > today) {
      // If viewing future week, all days are available
      availableDays = 7
    } else {
      // If viewing past week, no days are available
      availableDays = 0
    }

    // Calculate stats for the specific week being viewed
    const stats = {
      totalThisWeek: thisWeekBookings.length,
      totalCompleted: thisWeekBookings.filter(b => b.status === 'completed').length,
      totalCancelled: thisWeekBookings.filter(b => b.status === 'cancelled').length,
      totalActive: thisWeekBookings.filter(b => b.status === 'booked').length,
      availableDays: availableDays
    }
    
    setWeeklyStats(stats)
  }

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => 
      booking && 
      booking.booking_date && 
      isSameDay(parseISO(booking.booking_date), date)
    )
  }

  const getWeekDays = () => {
    const start = startOfWeek(currentWeek)
    return Array.from({ length: 7 }, (_, i) => addDays(start, i))
  }

  const handleBookSlot = (date: Date) => {
    setSelectedDate(date)
    setShowPatientManagement(true)
  }

  const handleBookingCreated = () => {
    console.log('BookingCalendar: handleBookingCreated called - refreshing bookings')
    setShowPatientManagement(false)
    fetchBookings()
    fetchAllBookingsForStats() // Refresh stats as well
  }



  if (showPatientManagement) {
    return (
      <PatientManagement
        selectedDate={selectedDate}
        onCancel={() => setShowPatientManagement(false)}
        onBookingCreated={handleBookingCreated}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>OT Booking Calendar</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium">
                  {format(startOfWeek(currentWeek), 'MMM d')} - {format(addDays(startOfWeek(currentWeek), 6), 'MMM d, yyyy')}
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => setCurrentWeek(new Date())}>
                Today
              </Button>
            </div>
          </div>
                      <div className="mt-2">
              <Badge variant="outline" className="text-sm">
                Operation Theater 1
              </Badge>
            </div>
        </CardHeader>
      </Card>

      {/* Professional Work Week Calendar Grid */}
      <div className="grid grid-cols-1 gap-4">
        {/* Time Slots Header */}
        <div className="grid grid-cols-8 gap-2 mb-4">
          <div className="text-center font-medium text-sm text-muted-foreground py-2">Time</div>
          {getWeekDays().map((day, index) => {
            const isToday = isSameDay(day, new Date())
            return (
              <div key={index} className="text-center space-y-1">
                <h3 className={`font-semibold ${isToday ? 'text-primary' : ''}`}>
                  {format(day, 'EEE')}
                </h3>
                <p className={`text-sm ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                  {format(day, 'MMM d')}
                </p>
              </div>
            )
          })}
        </div>

        {/* Time Slots Grid */}
        <div className="space-y-2">
          {Array.from({ length: 12 }, (_, hourIndex) => {
            const hour = 8 + hourIndex; // Start from 8 AM
            const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
            
            return (
              <div key={hour} className="grid grid-cols-8 gap-2 min-h-[60px]">
                {/* Time Column */}
                <div className="text-center text-sm text-muted-foreground py-3 border-r">
                  {timeSlot}
                </div>
                
                {/* Day Columns */}
                {getWeekDays().map((day, dayIndex) => {
                  const dayBookings = getBookingsForDate(day).filter(booking => {
                    if (!booking?.start_time) return false;
                    const bookingHour = parseInt(booking.start_time.split(':')[0]);
                    return bookingHour === hour;
                  });
                  
                  const isToday = isSameDay(day, new Date())
                  const isPast = day < new Date(new Date().setHours(0, 0, 0, 0))
                  
                  return (
                    <div 
                      key={dayIndex} 
                      className={`relative border rounded-lg p-2 min-h-[60px] ${
                        isToday ? 'bg-primary/5 border-primary/20' : 'bg-card border-border'
                      } ${isPast ? 'opacity-50' : 'hover:bg-muted/50'}`}
                    >
                      {/* Add Booking Button */}
                      {!isPast && dayBookings.length === 0 && (
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => handleBookSlot(day)}
                          className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      )}
                      
                      {/* Bookings */}
                      {dayBookings.map((booking) => {
                        if (!booking || !booking.patient || !booking.doctor) {
                          return null;
                        }
                        
                                                 const isMyBooking = currentDoctorId === booking.doctor_id;
                        console.log('Calendar Debug:', {
                          currentDoctorId,
                          bookingDoctorId: booking.doctor_id,
                          isMyBooking,
                          patientName: booking.patient?.name
                        });
                        const getStatusColor = (status: string) => {
                          switch (status) {
                            case 'completed': return 'text-green-600';
                            case 'cancelled': return 'text-orange-600';
                            case 'deleted': return 'text-red-600';
                            default: return 'text-blue-600';
                          }
                        };
                        
                        return (
                          <div 
                            key={booking.id}
                            className={`${
                              isMyBooking 
                                ? 'bg-blue-200 border-blue-500 shadow-sm' 
                                : 'bg-gray-200 border-gray-400'
                            } border-2 rounded p-1 mb-1 text-xs`}
                            title={isMyBooking ? 'My booking' : 'Other doctor\'s booking'}
                          >
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="font-medium">
                                {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <User className="h-2 w-2" />
                              <span className="truncate">{booking.patient?.name || 'Unknown'}</span>
                            </div>
                            <p className={`font-medium ${isMyBooking ? 'text-blue-900' : 'text-gray-900'}`}>
                              Dr. {booking.doctor?.name || 'Unknown'}
                            </p>
                            <Badge 
                              variant={isMyBooking ? "default" : "secondary"} 
                              className={`text-[10px] h-4 px-1 font-semibold ${
                                isMyBooking 
                                  ? 'bg-blue-600 text-white border-blue-700' 
                                  : 'bg-gray-600 text-white border-gray-700'
                              }`}
                            >
                              {booking.status}
                            </Badge>
                          </div>
                        );
                      }).filter(Boolean)}
                    </div>
                  )
                })}
              </div>
            );
          })}
        </div>
      </div>

             {/* Weekly Statistics */}
       <Card>
         <CardContent className="pt-6">
           <div className="grid grid-cols-5 gap-4 text-center">
             <div>
               <h3 className="text-2xl font-bold text-primary">{weeklyStats.totalThisWeek}</h3>
               <p className="text-sm text-muted-foreground">Total Bookings This Week</p>
             </div>
             <div>
               <h3 className="text-2xl font-bold text-green-600">{weeklyStats.totalCompleted}</h3>
               <p className="text-sm text-muted-foreground">Total Completed</p>
             </div>
             <div>
               <h3 className="text-2xl font-bold text-orange-600">{weeklyStats.totalCancelled}</h3>
               <p className="text-sm text-muted-foreground">Total Cancelled</p>
             </div>
             <div>
               <h3 className="text-2xl font-bold text-blue-600">{weeklyStats.totalActive}</h3>
               <p className="text-sm text-muted-foreground">Total Active</p>
             </div>
             <div>
               <h3 className="text-2xl font-bold text-gray-600">{weeklyStats.availableDays}</h3>
               <p className="text-sm text-muted-foreground">Available Days</p>
             </div>
           </div>
         </CardContent>
       </Card>


    </div>
  )
}