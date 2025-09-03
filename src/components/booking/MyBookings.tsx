import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/integrations/supabase/client'
import { toast } from '@/hooks/use-toast'
import { format, parseISO } from 'date-fns'
import { Calendar, Clock, User, FileText, CheckCircle, XCircle, AlertCircle, Search, Filter, SortAsc, SortDesc } from 'lucide-react'

interface Booking {
  id: string
  booking_date: string
  start_time: string
  end_time: string
  status: "booked" | "completed" | "cancelled"
  notes?: string
  operation_theater: number
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

export const MyBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDoctorId, setCurrentDoctorId] = useState<string | null>(null)
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    getCurrentDoctorId()
  }, [])

  useEffect(() => {
    if (currentDoctorId) {
      fetchMyBookings()
    }
  }, [currentDoctorId])

  useEffect(() => {
    applyFiltersAndSort()
  }, [bookings, searchTerm, statusFilter, dateFilter, sortBy, sortOrder])

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

  const fetchMyBookings = async () => {
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
        .eq('doctor_id', currentDoctorId)
        .eq('operation_theater', 1)
        .in('status', ['booked', 'completed', 'cancelled'])
        .order('booking_date', { ascending: false })
        .order('start_time')

      if (error) {
        toast({
          title: "Error",
          description: `Failed to load bookings: ${error.message}`,
          variant: "destructive",
        })
      } else {
        setBookings(data || [])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred while loading bookings",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const applyFiltersAndSort = () => {
    let filtered = [...bookings]

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(booking => 
        booking.patient?.name?.toLowerCase().includes(searchLower) ||
        booking.patient?.patient_id?.toLowerCase().includes(searchLower) ||
        booking.patient?.condition?.toLowerCase().includes(searchLower) ||
        (booking.notes && booking.notes.toLowerCase().includes(searchLower)) ||
        booking.doctor?.name?.toLowerCase().includes(searchLower) ||
        booking.doctor?.specialization?.toLowerCase().includes(searchLower)
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(booking => booking.status === statusFilter)
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const today = new Date()
      const todayStr = format(today, 'yyyy-MM-dd')
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(booking => booking.booking_date === todayStr)
          break
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.booking_date)
            return bookingDate >= weekAgo && bookingDate <= today
          })
          break
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.booking_date)
            return bookingDate >= monthAgo && bookingDate <= today
          })
          break
        case 'upcoming':
          filtered = filtered.filter(booking => {
            const bookingDate = new Date(booking.booking_date)
            return bookingDate >= today
          })
          break
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime()
          break
        case 'time':
          comparison = a.start_time.localeCompare(b.start_time)
          break
        case 'patient':
          comparison = (a.patient?.name || '').localeCompare(b.patient?.name || '')
          break
        case 'status':
          comparison = a.status.localeCompare(b.status)
          break
        default:
          comparison = 0
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredBookings(filtered)
  }

  const handleBookingStatusUpdate = async (bookingId: string, newStatus: "booked" | "completed" | "cancelled") => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId)

      if (error) {
        toast({
          title: "Update Failed",
          description: `Failed to update booking status: ${error.message}`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Status Updated",
          description: `Booking status updated to ${newStatus}`,
        })
        
        // Refresh the bookings list
        await fetchMyBookings()
        
        // Clear the selected booking if it was the one updated
        if (selectedBooking?.id === bookingId) {
          setSelectedBooking(null)
        }
        
        // Trigger a page refresh to update the calendar view
        // This ensures cancelled bookings are removed from the calendar
        if (newStatus === 'cancelled') {
          setTimeout(() => {
            window.location.reload()
          }, 1000)
        }
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const getStatusIcon = (status: "booked" | "completed" | "cancelled") => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-blue-600" />
    }
  }

  const getStatusColor = (status: "booked" | "completed" | "cancelled") => {
    switch (status) {
      case 'completed':
        return 'bg-green-200 text-green-900 border-green-600'
      case 'cancelled':
        return 'bg-red-200 text-red-900 border-red-600'
      default:
        return 'bg-blue-200 text-blue-900 border-blue-600'
    }
  }

  const getStatusText = (status: "booked" | "completed" | "cancelled") => {
    switch (status) {
      case 'completed':
        return 'COMPLETED'
      case 'cancelled':
        return 'CANCELLED'
      default:
        return 'ACTIVE'
    }
  }

  const getStatusActions = (status: "booked" | "completed" | "cancelled", bookingId: string) => {
    if (status === 'completed' || status === 'cancelled') {
      return null
    }

    return (
      <div className="flex gap-2 mt-3">
        <Button
          size="sm"
          variant="outline"
          className="text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
          onClick={() => handleBookingStatusUpdate(bookingId, 'completed')}
        >
          Mark as Completed
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="text-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
          onClick={() => handleBookingStatusUpdate(bookingId, 'cancelled')}
        >
          Cancel
        </Button>
      </div>
    )
  }

  const getBookingsStats = () => {
    const stats = {
      active: bookings.filter(b => b.status === 'booked').length,
      completed: bookings.filter(b => b.status === 'completed').length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      total: bookings.length
    }
    return stats
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setDateFilter('all')
    setSortBy('date')
    setSortOrder('desc')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your bookings...</p>
        </div>
      </div>
    )
  }

  const stats = getBookingsStats()

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            My Bookings
          </CardTitle>
          <p className="text-muted-foreground">
            Manage and track all your operation theater bookings
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-2xl font-bold text-blue-600">{stats.active}</h3>
              <p className="text-sm text-blue-700">Active</p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="text-2xl font-bold text-green-600">{stats.completed}</h3>
              <p className="text-sm text-green-700">Completed</p>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <h3 className="text-2xl font-bold text-red-600">{stats.cancelled}</h3>
              <p className="text-sm text-red-700">Cancelled</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-2xl font-bold text-gray-600">{stats.total}</h3>
              <p className="text-sm text-gray-700">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search patients, IDs, conditions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="booked">Booked</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Filter */}
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="time">Time</SelectItem>
                <SelectItem value="patient">Patient Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort Order */}
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-2"
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              {sortOrder === 'asc' ? 'Asc' : 'Desc'}
            </Button>
          </div>

          {/* Clear Filters */}
          <div className="flex justify-end mt-4">
            <Button variant="ghost" onClick={clearFilters} className="text-sm">
              Clear All Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Selected Booking Details */}
      {selectedBooking && (
        <Card className="border-2 border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Booking Details
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBooking(null)}
              >
                × Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Information */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg text-primary">Patient Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Name:</span>
                    <span>{selectedBooking.patient?.name || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Patient ID:</span>
                    <span>{selectedBooking.patient?.patient_id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Condition:</span>
                    <span>{selectedBooking.patient?.condition || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className="space-y-3">
                <h4 className="font-semibold text-lg text-primary">Booking Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Date:</span>
                    <span>{format(parseISO(selectedBooking.booking_date), 'PPP')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Time:</span>
                    <span>{selectedBooking.start_time} - {selectedBooking.end_time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge className={`${getStatusColor(selectedBooking.status)}`}>
                      {getStatusIcon(selectedBooking.status)}
                      <span className="ml-1">{getStatusText(selectedBooking.status)}</span>
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Operation Theater:</span>
                    <span>OT {selectedBooking.operation_theater}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes Section */}
            {selectedBooking.notes && (
              <div className="mt-6">
                <h4 className="font-semibold text-lg text-primary mb-3">Notes</h4>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm">{selectedBooking.notes}</p>
                </div>
              </div>
            )}

            {/* Status Actions */}
            <div className="mt-6 pt-4 border-t">
              <h4 className="font-semibold text-lg text-primary mb-3">Actions</h4>
              {getStatusActions(selectedBooking.status, selectedBooking.id)}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Bookings</CardTitle>
            <div className="text-sm text-muted-foreground">
              Showing {filteredBookings.length} of {bookings.length} bookings
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {bookings.length === 0 ? 'No bookings found' : 'No bookings match your filters'}
              </h3>
              <p className="text-muted-foreground">
                {bookings.length === 0 
                  ? "You haven't made any bookings yet." 
                  : "Try adjusting your search criteria or clearing filters."
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBookings.map((booking) => (
                <Card 
                  key={booking.id} 
                  className={`border-l-4 border-l-primary hover:shadow-md transition-shadow cursor-pointer ${
                    selectedBooking?.id === booking.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedBooking(selectedBooking?.id === booking.id ? null : booking)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">
                            {booking.patient?.name || 'Unknown Patient'}
                          </h3>
                          <Badge variant="outline" className="text-xs">
                            {booking.patient?.patient_id || 'No ID'}
                          </Badge>
                          <Badge className={`text-xs ${getStatusColor(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            <span className="ml-1">{getStatusText(booking.status)}</span>
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{format(parseISO(booking.booking_date), 'PPP')}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>{booking.start_time} - {booking.end_time}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>OT {booking.operation_theater}</span>
                          </div>
                        </div>

                        {booking.patient?.condition && (
                          <div className="flex items-start gap-2 mt-2">
                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="text-sm text-muted-foreground">
                              {booking.patient.condition}
                            </span>
                          </div>
                        )}

                        {booking.notes && (
                          <div className="mt-2 p-2 bg-muted/50 rounded text-sm">
                            <strong>Notes:</strong> {booking.notes}
                          </div>
                        )}

                        {getStatusActions(booking.status, booking.id)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
