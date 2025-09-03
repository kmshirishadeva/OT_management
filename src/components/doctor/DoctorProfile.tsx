import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Save, User } from 'lucide-react'

interface DoctorData {
  id: string
  employee_id: string
  name: string
  qualification: string
  specialization: Database['public']['Enums']['specialization']
  contact: string
  role: Database['public']['Enums']['user_role']
}

export const DoctorProfile = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [doctorData, setDoctorData] = useState<DoctorData | null>(null)
  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    qualification: '',
    specialization: 'surgeon' as Database['public']['Enums']['specialization'],
    contact: '',
    role: 'doctor' as Database['public']['Enums']['user_role']
  })

  useEffect(() => {
    if (user) {
      fetchDoctorProfile()
    }
  }, [user])

  const fetchDoctorProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      if (error) {
        console.error('Error fetching doctor profile:', error)
        return
      }

      setDoctorData(data)
      setFormData({
        employee_id: data.employee_id || '',
        name: data.name || '',
        qualification: data.qualification || '',
        specialization: data.specialization || 'surgeon',
        contact: data.contact || '',
        role: data.role || 'doctor'
      })
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!doctorData) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('doctors')
        .update({
          employee_id: formData.employee_id,
          name: formData.name,
          qualification: formData.qualification,
          specialization: formData.specialization,
          contact: formData.contact,
          role: formData.role
        })
        .eq('id', doctorData.id)

      if (error) {
        throw error
      }

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      })

      // Refresh the data
      await fetchDoctorProfile()
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading profile...</span>
      </div>
    )
  }

  if (!doctorData) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No profile data found.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Doctor Profile
        </CardTitle>
        <CardDescription>
          Update your professional information and contact details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee ID</Label>
              <Input
                id="employee_id"
                value={formData.employee_id}
                onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                placeholder="Enter employee ID"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="qualification">Qualification</Label>
              <Input
                id="qualification"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                placeholder="e.g., MBBS, MD"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization">Specialization</Label>
              <Select 
                value={formData.specialization} 
                onValueChange={(value) => setFormData({ ...formData, specialization: value as Database['public']['Enums']['specialization'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select specialization" />
                </SelectTrigger>
                <SelectContent>
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

            <div className="space-y-2">
              <Label htmlFor="contact">Contact Number</Label>
              <Input
                id="contact"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="Enter contact number"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({ ...formData, role: value as Database['public']['Enums']['user_role'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update Profile
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}