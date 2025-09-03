import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { AuthPage } from '@/components/auth/AuthPage'
import { Layout } from '@/components/layout/Layout'
import { SimpleBookingCalendar } from '@/components/calendar/SimpleBookingCalendar'
import { DoctorProfile } from '@/components/doctor/DoctorProfile'
import { AdminDashboard } from '@/components/admin/AdminDashboard'
import { MyBookings } from '@/components/booking/MyBookings'

const Index = () => {
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState('calendar')
  const [userRole, setUserRole] = useState('doctor')

  useEffect(() => {
    if (user) {
      fetchUserRole()
    }
  }, [user])

  const fetchUserRole = async () => {
    try {
      // First check if user is a doctor
      const { data: doctorData, error: doctorError } = await supabase
        .from('doctors')
        .select('role')
        .eq('user_id', user?.id)
        .maybeSingle()

      if (doctorData) {
        setUserRole(doctorData.role || 'doctor')
        return
      }

      // If not a doctor, check if user is an admin
      const { data: adminData, error: adminError } = await supabase
        .from('admins')
        .select('role')
        .eq('user_id', user?.id)
        .maybeSingle()

      if (adminData) {
        setUserRole('admin')
        return
      }

      // Default to doctor if no profile found
      setUserRole('doctor')
    } catch (error) {
      console.error('Error fetching user role:', error)
      setUserRole('doctor')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  const renderContent = () => {
    // Admin users only see the dashboard
    if (userRole === 'admin') {
      return <AdminDashboard />
    }
    
    // Doctors see calendar, my bookings, and profile options
    switch (activeTab) {
      case 'calendar':
        return <SimpleBookingCalendar />
      case 'my-bookings':
        return <MyBookings />
      case 'profile':
        return <DoctorProfile />
      default:
        return <SimpleBookingCalendar />
    }
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Tab Navigation - Only show for doctors */}
        {userRole !== 'admin' && (
          <div className="flex space-x-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Booking Calendar
            </button>
            <button
              onClick={() => setActiveTab('my-bookings')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'my-bookings'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              My Bookings
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'profile'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Profile Settings
            </button>
          </div>
        )}

        {/* Content */}
        {renderContent()}
      </div>
    </Layout>
  )
};

export default Index;
