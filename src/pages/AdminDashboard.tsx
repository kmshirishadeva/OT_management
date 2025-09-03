import { useAuth } from '@/hooks/useAuth'
import { Layout } from '@/components/layout/Layout'
import { AdminDashboard as AdminDashboardComponent } from '@/components/admin/AdminDashboard'
import { Card, CardContent } from '@/components/ui/card'

const AdminDashboard = () => {
  const { user } = useAuth()

  return (
    <Layout>
      <AdminDashboardComponent />
    </Layout>
  )
}

export default AdminDashboard