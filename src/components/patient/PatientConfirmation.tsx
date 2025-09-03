import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, User, Phone, FileText, Shield, Wrench, MessageSquare, ArrowLeft, CheckCircle } from 'lucide-react'

interface Patient {
  id: string
  name: string
  age: number
  patient_id: string
  gender: string | null
  emergency_contact: string | null
  condition: string
  medical_history: string | null
  icu_days: number | null
  expected_hospital_stay: number | null
  insurance: string | null
  instruments: string | null
  date_of_admission: string | null
  date_of_discharge: string | null
  sms_service: boolean | null
}

interface PatientConfirmationProps {
  patient: Patient
  onConfirm: () => void
  onChangePatient: () => void
  onCancel?: () => void
}

export const PatientConfirmation = ({ patient, onConfirm, onChangePatient, onCancel }: PatientConfirmationProps) => {
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Patient Confirmation
            </CardTitle>
            <CardDescription>
              Review patient details before proceeding to book OT slot
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onChangePatient} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Change Patient
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Patient Summary */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-3">
            <h3 className="font-semibold text-lg">{patient.name}</h3>
            <Badge variant="outline">{patient.patient_id}</Badge>
            {patient.gender && (
              <Badge variant="secondary" className="capitalize">
                {patient.gender}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Age: {patient.age} years • {patient.condition}
          </p>
        </div>

        {/* Detailed Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Basic Information
            </h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{patient.name}</p>
                  <p className="text-sm text-muted-foreground">Patient ID: {patient.patient_id}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{patient.age} years old</p>
                  <p className="text-sm text-muted-foreground">
                    {patient.gender ? `${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}` : 'Gender not specified'}
                  </p>
                </div>
              </div>

              {patient.emergency_contact && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Emergency Contact</p>
                    <p className="text-sm text-muted-foreground">{patient.emergency_contact}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Medical Information
            </h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">Medical Condition</p>
                  <p className="text-sm text-muted-foreground">{patient.condition}</p>
                </div>
              </div>

              {patient.medical_history && (
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Medical History</p>
                    <p className="text-sm text-muted-foreground">{patient.medical_history}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hospital Stay Information */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Hospital Stay
            </h4>
            <div className="space-y-3">
              {patient.expected_hospital_stay && (
                <div>
                  <p className="font-medium">Expected Stay</p>
                  <p className="text-sm text-muted-foreground">{patient.expected_hospital_stay} days</p>
                </div>
              )}

              {patient.icu_days && patient.icu_days > 0 && (
                <div>
                  <p className="font-medium">ICU Days</p>
                  <p className="text-sm text-muted-foreground">{patient.icu_days} days</p>
                </div>
              )}

              {patient.date_of_admission && (
                <div>
                  <p className="font-medium">Admission Date</p>
                  <p className="text-sm text-muted-foreground">{patient.date_of_admission}</p>
                </div>
              )}

              {patient.date_of_discharge && (
                <div>
                  <p className="font-medium">Expected Discharge</p>
                  <p className="text-sm text-muted-foreground">{patient.date_of_discharge}</p>
                </div>
              )}
            </div>
          </div>

          {/* Insurance & Equipment */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
              Insurance & Equipment
            </h4>
            <div className="space-y-3">
              {patient.insurance && (
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Insurance</p>
                    <p className="text-sm text-muted-foreground">{patient.insurance}</p>
                  </div>
                </div>
              )}

              {patient.instruments && (
                <div className="flex items-center gap-3">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Required Instruments</p>
                    <p className="text-sm text-muted-foreground">{patient.instruments}</p>
                  </div>
                </div>
              )}

              {patient.sms_service && (
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="font-medium text-green-600">SMS Service</p>
                    <p className="text-sm text-muted-foreground">Updates enabled</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-6 border-t">
          <Button onClick={onConfirm} className="flex-1">
            Confirm & Book OT Slot
          </Button>
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
