import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { 
  Calendar, Users, Clock, Trash2, Edit, Shield, Search, Filter, 
  CheckCircle, XCircle, User, ArrowLeft, Eye, Phone, Mail, 
  Stethoscope, FileText, Heart, Brain, Bone, Baby, Eye as EyeIcon,
  Ear, Heart as HeartIcon, Scissors, Pill, Syringe, Microscope
} from 'lucide-react'
import { format } from 'date-fns'

interface Doctor {
  id: string
  employee_id: string
  name: string
  qualification: string
  specialization: string
  contact: string
  role: string
  created_at: string
}

interface Patient {
  id: string
  name: string
  patient_id: string
  age: number
  gender: string | null
  condition: string
  emergency_contact: string | null
  medical_history: string | null
  icu_days: number | null
  expected_hospital_stay: number | null
  insurance: string | null
  instruments: string | null
  date_of_admission: string | null
  date_of_discharge: string | null
  sms_service: boolean | null
  created_at: string
}

interface Booking {
  id: string
  booking_date: string
  start_time: string
  end_time: string
  status: string
  notes: string
  operation_theater: number
  doctor: Doctor
  patient: Patient
}

type ViewMode = 'dashboard' | 'doctor-details' | 'patient-details' | 'patient-list'
type ActiveTab = 'bookings' | 'doctors' | 'patients'

export const AdminDashboard = () => {
  const { toast } = useToast()
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [specializationFilter, setSpecializationFilter] = useState('all')
  const [genderFilter, setGenderFilter] = useState('all')
  
  // View state management
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard')
  const [activeTab, setActiveTab] = useState<ActiveTab>('bookings')
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)

  // Statistics
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalBookings: 0,
    totalPatients: 0,
    activeBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    filterData()
  }, [searchTerm, statusFilter, specializationFilter, genderFilter, bookings, doctors, patients])

  useEffect(() => {
    calculateStats()
  }, [doctors, bookings, patients])

  const calculateStats = () => {
    setStats({
      totalDoctors: doctors.length,
      totalBookings: bookings.length,
      totalPatients: patients.length,
      activeBookings: bookings.filter(b => b.status === 'booked').length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length
    })
  }

  const filterData = () => {
    // Filter bookings
    let filtered = bookings.filter(booking => {
      const matchesSearch = 
        booking.doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
    setFilteredBookings(filtered)

    // Filter doctors
    let filteredDocs = doctors.filter(doctor => {
      const matchesSearch = 
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesSpecialization = 
        specializationFilter === 'all' || doctor.specialization === specializationFilter
      
      return matchesSearch && matchesSpecialization
    })
    setFilteredDoctors(filteredDocs)

    // Filter patients
    let filteredPats = patients.filter(patient => {
      const matchesSearch = 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesGender = 
        genderFilter === 'all' || patient.gender === genderFilter
      
      return matchesSearch && matchesGender
    })
    setFilteredPatients(filteredPats)
  }

  const fetchData = async () => {
    try {
      // Fetch all doctors
      const { data: doctorsData, error: doctorsError } = await supabase
        .from('doctors')
        .select('*')
        .order('created_at', { ascending: false })

      if (doctorsError) throw doctorsError

      // Fetch all patients
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false })

      if (patientsError) throw patientsError

      // Fetch all bookings with doctor and patient info
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          doctor:doctors(id, employee_id, name, qualification, specialization, contact, role, created_at),
          patient:patients(id, name, patient_id, age, gender, condition, emergency_contact, medical_history, icu_days, expected_hospital_stay, insurance, instruments, date_of_admission, date_of_discharge, sms_service, created_at)
        `)
        .order('booking_date', { ascending: false })

      if (bookingsError) throw bookingsError

      setDoctors(doctorsData || [])
      setPatients(patientsData || [])
      setBookings(bookingsData || [])
      setFilteredBookings(bookingsData || [])
      setFilteredDoctors(doctorsData || [])
      setFilteredPatients(patientsData || [])
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const deleteBooking = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId)

      if (error) throw error

      toast({
        title: "Booking Deleted",
        description: "The booking has been successfully deleted.",
      })

      fetchData() // Refresh data
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete booking",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked': return 'bg-blue-600'
      case 'completed': return 'bg-green-600'
      case 'cancelled': return 'bg-red-600'
      default: return 'bg-gray-600'
    }
  }

  const getRoleColor = (role: string) => {
    return role === 'admin' ? 'bg-purple-600' : 'bg-blue-600'
  }

  const getSpecializationIcon = (specialization: string) => {
    switch (specialization) {
      case 'surgeon': return <Scissors className="h-4 w-4" />
      case 'orthopedic': return <Bone className="h-4 w-4" />
      case 'neuro': return <Brain className="h-4 w-4" />
      case 'cardiac': return <HeartIcon className="h-4 w-4" />
      case 'pediatric': return <Baby className="h-4 w-4" />
      case 'gynecology': return <User className="h-4 w-4" />
      case 'ent': return <Ear className="h-4 w-4" />
      case 'ophthalmology': return <EyeIcon className="h-4 w-4" />
      case 'anesthesiology': return <Syringe className="h-4 w-4" />
      case 'general': return <Stethoscope className="h-4 w-4" />
      default: return <Stethoscope className="h-4 w-4" />
    }
  }

  const formatTime = (timeString: string) => {
    return format(new Date(`2000-01-01T${timeString}`), 'h:mm a')
  }

  const handleDoctorClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor)
    setViewMode('doctor-details')
  }

  const handlePatientClick = (patient: Patient) => {
    setSelectedPatient(patient)
    setViewMode('patient-details')
  }

  const handleBackToDashboard = () => {
    setViewMode('dashboard')
    setSelectedDoctor(null)
    setSelectedPatient(null)
    setActiveTab('bookings')
  }

  const handleStatusCardClick = (status: string) => {
    setActiveTab('bookings')
    setStatusFilter(status)
    setSearchTerm('') // Clear search when filtering by status
  }

  const getDoctorPatients = (doctorId: string) => {
    return bookings
      .filter(booking => booking.doctor.id === doctorId)
      .map(booking => booking.patient)
      .filter((patient, index, self) => 
        index === self.findIndex(p => p.id === patient.id)
      )
  }

  const getPatientBookings = (patientId: string) => {
    return bookings.filter(booking => booking.patient.id === patientId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Loading dashboard...</span>
      </div>
    )
  }

  // Doctor Details View
  if (viewMode === 'doctor-details' && selectedDoctor) {
    const doctorPatients = getDoctorPatients(selectedDoctor.id)
    const doctorBookings = bookings.filter(booking => booking.doctor.id === selectedDoctor.id)
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToDashboard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Doctor Details</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <User className="h-6 w-6" />
              {selectedDoctor.name}
            </CardTitle>
            <CardDescription>
              Employee ID: {selectedDoctor.employee_id} • {selectedDoctor.qualification}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Doctor Information</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Specialization:</strong> 
                    <Badge variant="outline" className="ml-2">
                      {getSpecializationIcon(selectedDoctor.specialization)}
                      {selectedDoctor.specialization}
                    </Badge>
                  </div>
                  <div><strong>Contact:</strong> {selectedDoctor.contact}</div>
                  <div><strong>Role:</strong> 
                    <Badge className={`ml-2 ${getRoleColor(selectedDoctor.role)}`}>
                      {selectedDoctor.role}
                    </Badge>
                  </div>
                  <div><strong>Joined:</strong> {format(new Date(selectedDoctor.created_at), 'MMM dd, yyyy')}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Statistics</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Total Patients:</strong> {doctorPatients.length}</div>
                  <div><strong>Total Bookings:</strong> {doctorBookings.length}</div>
                  <div><strong>Active Bookings:</strong> {doctorBookings.filter(b => b.status === 'booked').length}</div>
                  <div><strong>Completed Bookings:</strong> {doctorBookings.filter(b => b.status === 'completed').length}</div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Patients Being Treated</h3>
              {doctorPatients.length === 0 ? (
                <p className="text-muted-foreground">No patients found for this doctor.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {doctorPatients.map((patient) => (
                    <Card key={patient.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handlePatientClick(patient)}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{patient.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <div>ID: {patient.patient_id}</div>
                          <div>Age: {patient.age} • {patient.gender || 'N/A'}</div>
                          <div>Condition: {patient.condition}</div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Patient Details View
  if (viewMode === 'patient-details' && selectedPatient) {
    const patientBookings = getPatientBookings(selectedPatient.id)
    
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBackToDashboard}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <User className="h-6 w-6" />
            <h1 className="text-2xl font-bold">Patient Details</h1>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <User className="h-6 w-6" />
              {selectedPatient.name}
            </CardTitle>
            <CardDescription>
              Patient ID: {selectedPatient.patient_id} • Age: {selectedPatient.age} • Gender: {selectedPatient.gender || 'N/A'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Patient Information</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Condition:</strong> {selectedPatient.condition}</div>
                  <div><strong>Emergency Contact:</strong> {selectedPatient.emergency_contact || 'N/A'}</div>
                  <div><strong>Insurance:</strong> {selectedPatient.insurance || 'N/A'}</div>
                  <div><strong>Instruments:</strong> {selectedPatient.instruments || 'N/A'}</div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-3">Hospital Stay</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>ICU Days:</strong> {selectedPatient.icu_days || 'N/A'}</div>
                  <div><strong>Expected Stay:</strong> {selectedPatient.expected_hospital_stay || 'N/A'} days</div>
                  <div><strong>Admission Date:</strong> {selectedPatient.date_of_admission ? format(new Date(selectedPatient.date_of_admission), 'MMM dd, yyyy') : 'N/A'}</div>
                  <div><strong>Discharge Date:</strong> {selectedPatient.date_of_discharge ? format(new Date(selectedPatient.date_of_discharge), 'MMM dd, yyyy') : 'N/A'}</div>
                </div>
              </div>
            </div>

            {selectedPatient.medical_history && (
              <div>
                <h3 className="font-semibold mb-3">Medical History</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm">{selectedPatient.medical_history}</p>
                </div>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-3">Booking History</h3>
              {patientBookings.length === 0 ? (
                <p className="text-muted-foreground">No bookings found for this patient.</p>
              ) : (
                <div className="space-y-3">
                  {patientBookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={getStatusColor(booking.status)}>
                          {booking.status}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        <div><strong>Doctor:</strong> Dr. {booking.doctor.name} ({booking.doctor.specialization})</div>
                        <div><strong>Time:</strong> {formatTime(booking.start_time)} - {formatTime(booking.end_time)}</div>
                        <div><strong>OT:</strong> {booking.operation_theater}</div>
                        {booking.notes && <div><strong>Notes:</strong> {booking.notes}</div>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Main Dashboard View
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('doctors')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Doctors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDoctors}</div>
            <p className="text-xs text-muted-foreground">Click to view all doctors</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => {
          setActiveTab('bookings')
          setStatusFilter('all')
          setSearchTerm('')
        }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">Click to view all bookings</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('patients')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">Click to view all patients</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleStatusCardClick('booked')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Bookings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeBookings}</div>
            <p className="text-xs text-muted-foreground">Click to view active bookings</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleStatusCardClick('completed')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Bookings</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completedBookings}</div>
            <p className="text-xs text-muted-foreground">Click to view completed bookings</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleStatusCardClick('cancelled')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled Bookings</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.cancelledBookings}</div>
            <p className="text-xs text-muted-foreground">Click to view cancelled bookings</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ActiveTab)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="bookings">All Bookings</TabsTrigger>
          <TabsTrigger value="doctors">All Doctors</TabsTrigger>
          <TabsTrigger value="patients">All Patients</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booking Management</CardTitle>
              <CardDescription>
                View and manage all Operating Theatre bookings
              </CardDescription>
              
              {/* Booking Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by doctor, patient name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="booked">Booked</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredBookings.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {bookings.length === 0 ? 'No bookings found' : 'No bookings match the current filters'}
                  </p>
                ) : (
                  filteredBookings.map((booking) => (
                    <div key={booking.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(booking.status)}>
                            {booking.status}
                          </Badge>
                          <Badge variant="outline">
                            OT {booking.operation_theater}
                          </Badge>
                          <span className="font-medium">
                            {format(new Date(booking.booking_date), 'MMM dd, yyyy')}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => deleteBooking(booking.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Doctor:</strong> {booking.doctor.name}<br />
                          <span className="text-muted-foreground">
                            {booking.doctor.specialization} • {booking.doctor.employee_id}
                          </span>
                        </div>
                        <div>
                          <strong>Patient:</strong> {booking.patient.name}<br />
                          <span className="text-muted-foreground">
                            {booking.patient.patient_id} • {booking.patient.condition}
                          </span>
                        </div>
                      </div>
                      
                      {booking.notes && (
                        <div className="text-sm">
                          <strong>Notes:</strong> {booking.notes}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="doctors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Doctor Management</CardTitle>
              <CardDescription>
                View and manage all registered doctors
              </CardDescription>
              
              {/* Doctor Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by doctor name or employee ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={specializationFilter} onValueChange={setSpecializationFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Specialization" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Specializations</SelectItem>
                      <SelectItem value="surgeon">Surgeon</SelectItem>
                      <SelectItem value="orthopedic">Orthopedic</SelectItem>
                      <SelectItem value="neuro">Neuro</SelectItem>
                      <SelectItem value="cardiac">Cardiac</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="pediatric">Pediatric</SelectItem>
                      <SelectItem value="gynecology">Gynecology</SelectItem>
                      <SelectItem value="ent">ENT</SelectItem>
                      <SelectItem value="ophthalmology">Ophthalmology</SelectItem>
                      <SelectItem value="anesthesiology">Anesthesiology</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredDoctors.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {doctors.length === 0 ? 'No doctors found' : 'No doctors match the current filters'}
                  </p>
                ) : (
                  filteredDoctors.map((doctor) => (
                    <Card key={doctor.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleDoctorClick(doctor)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div>
                              <h3 className="font-medium">{doctor.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {doctor.qualification} • {doctor.employee_id}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getRoleColor(doctor.role)}>
                              {doctor.role}
                            </Badge>
                            <Badge variant="outline">
                              {getSpecializationIcon(doctor.specialization)}
                              {doctor.specialization}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                          <div>
                            <strong>Contact:</strong> {doctor.contact}
                          </div>
                          <div>
                            <strong>Joined:</strong> {format(new Date(doctor.created_at), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient Management</CardTitle>
              <CardDescription>
                View and manage all registered patients
              </CardDescription>
              
              {/* Patient Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by patient name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={genderFilter} onValueChange={setGenderFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Genders</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredPatients.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    {patients.length === 0 ? 'No patients found' : 'No patients match the current filters'}
                  </p>
                ) : (
                  filteredPatients.map((patient) => (
                    <Card key={patient.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handlePatientClick(patient)}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div>
                              <h3 className="font-medium">{patient.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                ID: {patient.patient_id} • Age: {patient.age} • {patient.gender || 'N/A'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {patient.condition}
                            </Badge>
                            {patient.icu_days && (
                              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                                ICU: {patient.icu_days} days
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm mt-3">
                          <div>
                            <strong>Emergency Contact:</strong> {patient.emergency_contact || 'N/A'}
                          </div>
                          <div>
                            <strong>Insurance:</strong> {patient.insurance || 'N/A'}
                          </div>
                        </div>
                        
                        {patient.medical_history && (
                          <div className="mt-3">
                            <strong>Medical History:</strong>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {patient.medical_history}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}