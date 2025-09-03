import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PatientManagement } from '@/components/patient/PatientManagement'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { format, addDays, startOfWeek, isSameDay, parseISO, startOfMonth, endOfMonth, endOfWeek, addMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Calendar, Clock } from 'lucide-react'

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

export const SimpleBookingCalendar = () => {
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [currentDay, setCurrentDay] = useState(new Date())
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
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
      calculateViewStats()
    }
  }, [allBookingsForStats, viewMode, currentDay, currentWeek, currentMonth])

  // Recalculate stats when week changes
  useEffect(() => {
    if (allBookingsForStats.length > 0) {
      calculateViewStats()
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

  const calculateViewStats = () => {
    let stats = {
      totalThisWeek: 0,
      totalCompleted: 0,
      totalCancelled: 0,
      totalActive: 0,
      availableDays: 0
    }
    
    if (viewMode === 'day') {
      // Day view stats
      const dayBookings = allBookingsForStats.filter(booking => {
        const bookingDate = new Date(booking.booking_date)
        return isSameDay(bookingDate, currentDay)
      })
      
      // Calculate available hours from current time onwards
      const today = new Date()
      let availableHours = 0
      
      if (isSameDay(currentDay, today)) {
        // If viewing today, calculate remaining hours from now
        const currentHour = today.getHours()
        availableHours = 24 - currentHour
      } else if (currentDay > today) {
        // If viewing future day, all hours are available
        availableHours = 24
      } else {
        // If viewing past day, no hours are available
        availableHours = 0
      }
      
      stats = {
        totalThisWeek: dayBookings.length,
        totalCompleted: dayBookings.filter(b => b.status === 'completed').length,
        totalCancelled: dayBookings.filter(b => b.status === 'cancelled').length,
        totalActive: dayBookings.filter(b => b.status === 'booked').length,
        availableDays: availableHours
      }
    } else if (viewMode === 'week') {
      // Week view stats (ensure it's dynamic)
      const startOfViewedWeek = startOfWeek(currentWeek)
      const endOfViewedWeek = addDays(startOfViewedWeek, 6)
      
      const thisWeekBookings = allBookingsForStats.filter(booking => {
        const bookingDate = new Date(booking.booking_date)
        return bookingDate >= startOfViewedWeek && bookingDate <= endOfViewedWeek
      })

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

      stats = {
        totalThisWeek: thisWeekBookings.length,
        totalCompleted: thisWeekBookings.filter(b => b.status === 'completed').length,
        totalCancelled: thisWeekBookings.filter(b => b.status === 'cancelled').length,
        totalActive: thisWeekBookings.filter(b => b.status === 'booked').length,
        availableDays: availableDays
      }
    } else if (viewMode === 'month') {
      // Month view stats
      const startOfViewedMonth = startOfMonth(currentMonth)
      const endOfViewedMonth = endOfMonth(currentMonth)
      
      const thisMonthBookings = allBookingsForStats.filter(booking => {
        const bookingDate = new Date(booking.booking_date)
        return bookingDate >= startOfViewedMonth && bookingDate <= endOfViewedMonth
      })

      const daysInMonth = endOfViewedMonth.getDate()
      const today = new Date()
      const isCurrentMonth = currentMonth.getMonth() === today.getMonth() && currentMonth.getFullYear() === today.getFullYear()
      
      let availableDays = 0
      if (isCurrentMonth) {
        availableDays = daysInMonth - today.getDate()
      } else if (currentMonth > today) {
        availableDays = daysInMonth
      } else {
        availableDays = 0
      }

      stats = {
        totalThisWeek: thisMonthBookings.length,
        totalCompleted: thisMonthBookings.filter(b => b.status === 'completed').length,
        totalCancelled: thisMonthBookings.filter(b => b.status === 'cancelled').length,
        totalActive: thisMonthBookings.filter(b => b.status === 'booked').length,
        availableDays: availableDays
      }
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

  const getMonthDays = () => {
    const start = startOfMonth(currentMonth) // Use currentMonth for month view
    const end = endOfMonth(currentMonth)
    const startDate = startOfWeek(start)
    const endDate = endOfWeek(end)
    
    const days = []
    let current = startDate
    
    while (current <= endDate) {
      days.push(current)
      current = addDays(current, 1)
    }
    
    return days
  }

  const renderBookingCard = (booking: Booking) => {
    if (!booking || !booking.patient || !booking.doctor) {
      return null
    }
    
    const isMyBooking = currentDoctorId === booking.doctor_id
    
    return (
      <div 
        className={`${
          isMyBooking 
            ? booking.status === 'completed'
              ? 'bg-green-200 border-green-600 shadow-md'
              : 'bg-blue-200 border-blue-500 shadow-sm'
            : booking.status === 'completed'
              ? 'bg-gray-200 border-gray-600 shadow-md'
              : 'bg-gray-200 border-gray-400'
        } border-2 rounded-lg p-3 space-y-1`}
        title={isMyBooking ? `My ${booking.status} booking` : `Other doctor's ${booking.status} booking`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="text-xs font-medium">
              {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
            </span>
          </div>
          <Badge 
            variant={isMyBooking ? "default" : "secondary"} 
            className={`text-xs font-semibold ${
              isMyBooking 
                ? booking.status === 'completed'
                  ? 'bg-green-600 text-white border-green-700'
                  : 'bg-blue-600 text-white border-blue-700'
                : booking.status === 'completed'
                  ? 'bg-gray-600 text-white border-gray-700'
                  : 'bg-gray-600 text-white border-gray-700'
            }`}
          >
            {booking.status}
          </Badge>
        </div>
        
        <div className="text-xs space-y-1">
          <p className={`font-medium ${
            isMyBooking 
              ? booking.status === 'completed'
                ? 'text-green-900'
                : 'text-blue-900'
              : 'text-gray-900'
          }`}>
            {booking.patient?.name || 'Unknown Patient'}
          </p>
          <p className="text-muted-foreground">ID: {booking.patient?.patient_id || 'N/A'}</p>
          <p className={`font-medium ${
            isMyBooking 
              ? booking.status === 'completed'
                ? 'text-green-800'
                : 'text-blue-800'
              : 'text-gray-700'
          }`}>
            Dr. {booking.doctor?.name || 'Unknown'}
          </p>
          <p className="text-muted-foreground capitalize">{booking.doctor?.specialization || 'N/A'}</p>
        </div>
      </div>
    )
  }

  const renderCompactBookingCard = (booking: Booking) => {
    if (!booking || !booking.patient || !booking.doctor) {
      return null
    }
    
    const isMyBooking = currentDoctorId === booking.doctor_id
    
    return (
      <div 
        className={`${
          isMyBooking 
            ? booking.status === 'completed'
              ? 'bg-green-100 border-green-400'
              : 'bg-blue-100 border-blue-400'
            : 'bg-gray-100 border-gray-400'
        } border rounded px-1 py-0.5 text-xs truncate`}
        title={`${booking.patient?.name} - ${booking.start_time.slice(0, 5)}`}
      >
        <div className="font-medium truncate">{booking.patient?.name}</div>
        <div className="text-muted-foreground">{booking.start_time.slice(0, 5)}</div>
      </div>
    )
  }

  const handleBookSlot = (date: Date) => {
    setSelectedDate(date)
    setShowPatientManagement(true)
  }

  const handleBookingCreated = () => {
    console.log('SimpleBookingCalendar: handleBookingCreated called - refreshing bookings')
    setShowPatientManagement(false)
    fetchBookings()
    fetchAllBookingsForStats() // Refresh stats as well
    // Force stats recalculation after a short delay to ensure data is loaded
    setTimeout(() => {
      calculateViewStats()
    }, 100)
  }

  const refreshCalendar = () => {
    console.log('SimpleBookingCalendar: Manual refresh triggered')
    fetchBookings()
    fetchAllBookingsForStats()
    setTimeout(() => {
      calculateViewStats()
    }, 100)
  }

  // Add effect to refresh stats when bookings change
  useEffect(() => {
    if (bookings.length > 0 || allBookingsForStats.length > 0) {
      calculateViewStats()
    }
  }, [bookings, allBookingsForStats])

  // Add effect to refresh calendar when month changes
  useEffect(() => {
    if (viewMode === 'month' && allBookingsForStats.length > 0) {
      calculateViewStats()
    }
  }, [currentMonth, viewMode, allBookingsForStats])


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
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              OT Booking Calendar
            </CardTitle>

            <div className="flex items-center gap-4">
              {/* View Mode Selector */}
              <div className="flex items-center gap-1 border rounded-md p-1">
                <Button
                  variant={viewMode === 'day' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('day')}
                  className="h-8 px-3 text-xs"
                >
                  Day
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                  className="h-8 px-3 text-xs"
                >
                  Week
                </Button>
                <Button
                  variant={viewMode === 'month' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('month')}
                  className="h-8 px-3 text-xs"
                >
                  Month
                </Button>
              </div>
              
              {/* Navigation Controls */}
              {viewMode === 'day' && (
              <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentDay(addDays(currentDay, -1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium text-sm">
                    {format(currentDay, 'EEEE, MMM d, yyyy')}
                  </span>
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentDay(addDays(currentDay, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
              </div>
              )}
              
              {viewMode === 'week' && (
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium text-sm">
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
              )}
              
              {viewMode === 'month' && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="font-medium text-sm">
                    {format(currentMonth, 'MMMM yyyy')}
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const today = new Date()
                  setCurrentDay(today)
                  setCurrentWeek(today)
                  setCurrentMonth(today)
                }}
              >
                Today
              </Button>
              
              {/* Manual Refresh Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshCalendar}
                className="ml-2"
              >
                <Clock className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Badge variant="outline" className="w-fit">
            Operation Theater 1
          </Badge>
        </CardHeader>
      </Card>

      {/* Calendar Grid */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {format(currentDay, 'EEEE, MMMM d, yyyy')}
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleBookSlot(currentDay)}
                  className="ml-4"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Book Slot
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(() => {
                  const dayBookings = getBookingsForDate(currentDay)
                  
                  if (dayBookings.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground text-lg">No bookings for this day</p>
                      </div>
                    )
                  }
                  
                  return (
                    <div className="space-y-3">
                      {dayBookings.map(booking => (
                        <div key={booking.id}>
                          {renderBookingCard(booking)}
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === 'week' && (
      <div className="grid grid-cols-7 gap-4">
        {getWeekDays().map((day, index) => {
          const dayBookings = getBookingsForDate(day)
          const isToday = isSameDay(day, new Date())
          const isPast = day < new Date(new Date().setHours(0, 0, 0, 0))
          
          return (
            <Card key={index} className={`min-h-[300px] ${isToday ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="pb-3">
                <div className="text-center">
                  <h3 className={`font-semibold text-lg ${isToday ? 'text-primary' : ''}`}>
                    {format(day, 'EEE')}
                  </h3>
                  <p className={`text-sm ${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>
                    {format(day, 'MMM d')}
                  </p>
                </div>
                
                {/* Add Booking Button */}
                {!isPast && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleBookSlot(day)}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Book Slot
                  </Button>
                )}
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {dayBookings.length === 0 ? (
                    <p className="text-center text-muted-foreground text-sm py-4">
                      No bookings
                    </p>
                  ) : (
                    dayBookings.map((booking) => {
                        return renderBookingCard(booking);
                    }).filter(Boolean)
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
        </div>
      )}

      {viewMode === 'month' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
                
                {/* Month grid */}
                {getMonthDays().map((day, index) => {
                  if (!day) {
                    return <div key={index} className="h-24" />
                  }
                  
                  const dayBookings = getBookingsForDate(day)
                  const isToday = isSameDay(day, new Date())
                  const isCurrentMonth = day.getMonth() === currentMonth.getMonth()
                  
                  return (
                    <div 
                      key={index} 
                      className={`h-24 border p-1 ${
                        isToday 
                          ? 'bg-blue-50 border-blue-300' 
                          : isCurrentMonth 
                            ? 'bg-white' 
                            : 'bg-gray-50'
                      }`}
                    >
                      <div className={`text-xs font-medium mb-1 ${
                        isToday 
                          ? 'text-blue-600' 
                          : isCurrentMonth 
                            ? 'text-gray-900' 
                            : 'text-gray-400'
                      }`}>
                        {format(day, 'd')}
      </div>

                      <div className="space-y-1 max-h-16 overflow-y-auto">
                        {dayBookings.slice(0, 3).map(booking => (
                          <div key={booking.id} className="text-xs">
                            {renderCompactBookingCard(booking)}
                          </div>
                        ))}
                        {dayBookings.length > 3 && (
                          <div className="text-xs text-muted-foreground">
                            +{dayBookings.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

             {/* Weekly Statistics */}
      <Card>
        <CardContent className="pt-6">
                       <div className="grid grid-cols-5 gap-4 text-center">
              <div>
                <h3 className="text-2xl font-bold text-primary">{weeklyStats.totalThisWeek}</h3>
                <p className="text-sm text-muted-foreground">
                  {viewMode === 'day' ? 'Total Bookings Today' : 
                   viewMode === 'week' ? 'Total Bookings This Week' : 
                   'Total Bookings This Month'}
                </p>
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
                <p className="text-sm text-muted-foreground">
                  {viewMode === 'day' ? 'Available Hours' : 
                   viewMode === 'week' ? 'Available Days' : 
                   'Available Days'}
                </p>
              </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}