import { ReactNode, useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Stethoscope, 
  Calendar, 
  Users, 
  Settings,
  LogOut,
  User,
  Shield
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const { user, signOut } = useAuth()
  const [userRole, setUserRole] = useState<string>('doctor')
  const [activeTab, setActiveTab] = useState('calendar')

  useEffect(() => {
    if (user) {
      fetchUserRole()
    }
  }, [user])

  const fetchUserRole = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('role')
        .eq('user_id', user?.id)
        .single()

      if (error) {
        console.error('Error fetching user role:', error)
        return
      }

      setUserRole(data.role || 'doctor')
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg">
                <Stethoscope className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-primary">OT Management</h1>
                <p className="text-sm text-muted-foreground">Operation Theatre Booking</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{user?.email}</span>
                <Badge variant="secondary" className="ml-2">
                  {userRole === 'admin' ? 'Admin' : 'Doctor'}
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={signOut}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}