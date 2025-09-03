import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Calendar, User, Phone, FileText, Shield, Wrench, MessageSquare, Stethoscope } from 'lucide-react'

interface PatientFormProps {
  onPatientCreated?: (patient: any) => void
  onCancel?: () => void
}

export const PatientForm = ({ onPatientCreated, onCancel }: PatientFormProps) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [patientData, setPatientData] = useState({
    name: '',
    age: '',
    patientId: '',
    gender: '',
    emergencyContact: '',
    condition: '',
    medicalHistory: '',
    icuDays: 0,
    expectedHospitalStay: 1,
    insurance: '',
    instruments: '',
    dateOfAdmission: '',
    dateOfDischarge: '',
    smsService: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase
        .from('patients')
        .insert([{
          name: patientData.name,
          age: parseInt(patientData.age),
          patient_id: patientData.patientId,
          gender: patientData.gender,
          emergency_contact: patientData.emergencyContact,
          condition: patientData.condition,
          medical_history: patientData.medicalHistory,
          icu_days: patientData.icuDays,
          expected_hospital_stay: patientData.expectedHospitalStay,
          insurance: patientData.insurance,
          instruments: patientData.instruments,
          date_of_admission: patientData.dateOfAdmission || null,
          date_of_discharge: patientData.dateOfDischarge || null,
          sms_service: patientData.smsService
        }])
        .select()
        .single()

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to create patient",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Patient Created",
          description: "Patient has been successfully added to the system",
        })
        onPatientCreated?.(data)
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
    
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Add New Patient
        </CardTitle>
        <CardDescription>
          Fill in all patient details to register them in the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={patientData.name}
                  onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  value={patientData.age}
                  onChange={(e) => setPatientData({ ...patientData, age: e.target.value })}
                  placeholder="30"
                  min="1"
                  max="150"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select value={patientData.gender} onValueChange={(value) => setPatientData({ ...patientData, gender: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="patientId">Patient ID *</Label>
                <Input
                  id="patientId"
                  value={patientData.patientId}
                  onChange={(e) => setPatientData({ ...patientData, patientId: e.target.value })}
                  placeholder="P001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="emergencyContact"
                    value={patientData.emergencyContact}
                    onChange={(e) => setPatientData({ ...patientData, emergencyContact: e.target.value })}
                    placeholder="+1234567890"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Medical Information</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="condition">Medical Condition *</Label>
                <Textarea
                  id="condition"
                  value={patientData.condition}
                  onChange={(e) => setPatientData({ ...patientData, condition: e.target.value })}
                  placeholder="Description of medical condition requiring surgery"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="medicalHistory">Medical History</Label>
                <Textarea
                  id="medicalHistory"
                  value={patientData.medicalHistory}
                  onChange={(e) => setPatientData({ ...patientData, medicalHistory: e.target.value })}
                  placeholder="Previous medical conditions, surgeries, allergies, etc."
                />
              </div>
            </div>
          </div>

          {/* Hospital Stay Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Hospital Stay Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icuDays">ICU Days (Expected)</Label>
                <Input
                  id="icuDays"
                  type="number"
                  value={patientData.icuDays}
                  onChange={(e) => setPatientData({ ...patientData, icuDays: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  min="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expectedHospitalStay">Expected Hospital Stay (Days)</Label>
                <Input
                  id="expectedHospitalStay"
                  type="number"
                  value={patientData.expectedHospitalStay}
                  onChange={(e) => setPatientData({ ...patientData, expectedHospitalStay: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                  min="1"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateOfAdmission">Date of Admission</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dateOfAdmission"
                    type="date"
                    value={patientData.dateOfAdmission}
                    onChange={(e) => setPatientData({ ...patientData, dateOfAdmission: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateOfDischarge">Expected Date of Discharge</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dateOfDischarge"
                    type="date"
                    value={patientData.dateOfDischarge}
                    onChange={(e) => setPatientData({ ...patientData, dateOfDischarge: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Insurance and Instruments */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Insurance & Equipment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="insurance">Insurance Provider</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="insurance"
                    value={patientData.insurance}
                    onChange={(e) => setPatientData({ ...patientData, insurance: e.target.value })}
                    placeholder="Insurance company name"
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instruments">Required Instruments</Label>
                                  <div className="relative">
                    <Wrench className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="instruments"
                    value={patientData.instruments}
                    onChange={(e) => setPatientData({ ...patientData, instruments: e.target.value })}
                    placeholder="Special instruments needed"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SMS Service */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Communication</h3>
            <div className="flex items-center space-x-2">
              <Switch
                id="smsService"
                checked={patientData.smsService}
                onCheckedChange={(checked) => setPatientData({ ...patientData, smsService: checked })}
              />
              <Label htmlFor="smsService" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Enable SMS Service for Updates
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Creating Patient..." : "Add Patient"}
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
