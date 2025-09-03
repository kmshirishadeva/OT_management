import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/hooks/use-toast'
import { Stethoscope, UserPlus, LogIn } from 'lucide-react'

const specializations = [
  'surgeon',
  'orthopedic', 
  'neuro',
  'cardiac',
  'general',
  'pediatric',
  'gynecology',
  'ent',
  'ophthalmology',
  'anesthesiology'
]

export const AuthPage = () => {
  const { signIn, signUp } = useAuth()
  const [loading, setLoading] = useState(false)

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  })

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    employeeId: '',
    name: '',
    qualification: '',
    specialization: '',
    contact: '',
    role: 'doctor'
  })

  const [adminData, setAdminData] = useState({
    email: '',
    password: '',
    employeeId: '',
    name: '',
    contact: '',
    role: 'ot_admin'
  })

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await signIn(signInData.email, signInData.password)
    
    if (error) {
      let errorMessage = "Invalid email or password"
      
      if (error.message?.includes("Email not confirmed")) {
        errorMessage = "Please check your email and click the confirmation link before signing in."
      } else if (error.message?.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please check your credentials."
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Welcome back!",
        description: "You have been signed in successfully.",
      })
      // Clear the form on successful sign in
      setSignInData({
        email: '',
        password: ''
      })
    }
    
    setLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await signUp(signUpData)
    
    if (error) {
      let errorMessage = "Failed to create account"
      
      if (error.message?.includes("duplicate key value violates unique constraint")) {
        if (error.message.includes("doctors_employee_id_key")) {
          errorMessage = "This Employee ID is already registered. Please use a different Employee ID."
        } else if (error.message.includes("email")) {
          errorMessage = "This email is already registered. Please sign in instead."
        }
      } else if (error.message?.includes("Email address") && error.message?.includes("invalid")) {
        errorMessage = "Please enter a valid email address."
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Registration Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Account Created",
        description: "Please check your email to verify your account.",
      })
      // Clear the form on successful registration
      setSignUpData({
        email: '',
        password: '',
        employeeId: '',
        name: '',
        qualification: '',
        specialization: '',
        contact: '',
        role: 'doctor'
      })
    }
    
    setLoading(false)
  }

  const handleAdminSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await signUp({
      ...adminData,
      adminRole: adminData.role
    })
    
    if (error) {
      let errorMessage = "Failed to create admin account"
      
      if (error.message?.includes("duplicate key value violates unique constraint")) {
        if (error.message.includes("admins_employee_id_key")) {
          errorMessage = "This Employee ID is already registered. Please use a different Employee ID."
        } else if (error.message.includes("email")) {
          errorMessage = "This email is already registered. Please sign in instead."
        }
      } else if (error.message?.includes("Email address") && error.message?.includes("invalid")) {
        errorMessage = "Please enter a valid email address."
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast({
        title: "Admin Registration Failed",
        description: errorMessage,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Admin Account Created",
        description: "Please check your email to verify your account.",
      })
      // Clear the form on successful registration
      setAdminData({
        email: '',
        password: '',
        employeeId: '',
        name: '',
        contact: '',
        role: 'ot_admin'
      })
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-primary p-4 rounded-full">
              <Stethoscope className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-primary">OT Management</h1>
          <p className="text-muted-foreground">Operation Theatre Slot Booking System</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Access Your Account</CardTitle>
            <CardDescription>
              Sign in to manage OT bookings or register as a new doctor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="signin" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Doctor
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Admin
                </TabsTrigger>
              </TabsList>

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="doctor@hospital.com"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      value={signInData.password}
                      onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="Dr. John Doe"
                        value={signUpData.name}
                        onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employee-id">Employee ID</Label>
                      <Input
                        id="employee-id"
                        placeholder="DOC001"
                        value={signUpData.employeeId}
                        onChange={(e) => setSignUpData({ ...signUpData, employeeId: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="doctor@hospital.com"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={signUpData.password}
                      onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="qualification">Qualification</Label>
                      <Input
                        id="qualification"
                        placeholder="MBBS, MS"
                        value={signUpData.qualification}
                        onChange={(e) => setSignUpData({ ...signUpData, qualification: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="specialization">Specialization</Label>
                      <Select 
                        value={signUpData.specialization} 
                        onValueChange={(value) => setSignUpData({ ...signUpData, specialization: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialization" />
                        </SelectTrigger>
                        <SelectContent>
                          {specializations.map((spec) => (
                            <SelectItem key={spec} value={spec}>
                              {spec.charAt(0).toUpperCase() + spec.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact</Label>
                    <Input
                      id="contact"
                      placeholder="Phone or email"
                      value={signUpData.contact}
                      onChange={(e) => setSignUpData({ ...signUpData, contact: e.target.value })}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin">
                <form onSubmit={handleAdminSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="admin-name">Full Name</Label>
                      <Input
                        id="admin-name"
                        placeholder="Admin Name"
                        value={adminData.name}
                        onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="admin-employee-id">Admin ID</Label>
                      <Input
                        id="admin-employee-id"
                        placeholder="ADM001"
                        value={adminData.employeeId}
                        onChange={(e) => setAdminData({ ...adminData, employeeId: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="admin-email">Email</Label>
                    <Input
                      id="admin-email"
                      type="email"
                      placeholder="admin@hospital.com"
                      value={adminData.email}
                      onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="admin-password">Password</Label>
                    <Input
                      id="admin-password"
                      type="password"
                      value={adminData.password}
                      onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="admin-contact">Contact</Label>
                    <Input
                      id="admin-contact"
                      placeholder="Phone or email"
                      value={adminData.contact}
                      onChange={(e) => setAdminData({ ...adminData, contact: e.target.value })}
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Creating Admin Account..." : "Create Admin Account"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}