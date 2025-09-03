import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { User, Plus, Search, Calendar, Phone, FileText } from 'lucide-react'

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

interface PatientSelectionProps {
  onPatientSelected: (patient: Patient) => void
  onAddPatient: () => void
  onCancel?: () => void
}

export const PatientSelection = ({ onPatientSelected, onAddPatient, onCancel }: PatientSelectionProps) => {
  const { toast } = useToast()
  const [patients, setPatients] = useState<Patient[]>([])
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchPatients()
  }, [])

  useEffect(() => {
    filterPatients()
  }, [searchTerm, patients])

  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('name')

      if (error) {
        toast({
          title: "Error",
          description: "Failed to load patients",
          variant: "destructive",
        })
      } else {
        setPatients(data || [])
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterPatients = () => {
    if (!searchTerm.trim()) {
      setFilteredPatients(patients)
      return
    }

    const filtered = patients.filter(patient =>
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.patient_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.condition.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredPatients(filtered)
  }

  const handlePatientSelect = (patient: Patient) => {
    onPatientSelected(patient)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading patients...</p>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Patient
            </CardTitle>
            <CardDescription>
              Choose a patient from the list or add a new one
            </CardDescription>
          </div>
          <Button onClick={onAddPatient} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Patient
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patients by name, ID, or condition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Patient List */}
        <div className="space-y-3">
          {filteredPatients.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'No patients found' : 'No patients available'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm 
                  ? 'Try adjusting your search terms or add a new patient.'
                  : 'Start by adding your first patient to the system.'
                }
              </p>
              <Button onClick={onAddPatient} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add First Patient
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredPatients.map((patient) => (
                <Card 
                  key={patient.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
                  onClick={() => handlePatientSelect(patient)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{patient.name}</h3>
                          <Badge variant="outline">{patient.patient_id}</Badge>
                          {patient.gender && (
                            <Badge variant="secondary" className="capitalize">
                              {patient.gender}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Age: {patient.age} years</span>
                          </div>
                          
                          {patient.emergency_contact && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{patient.emergency_contact}</span>
                            </div>
                          )}
                          
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground mt-0.5" />
                            <span className="line-clamp-2">{patient.condition}</span>
                          </div>
                        </div>

                        {/* Additional Details */}
                        <div className="mt-3 pt-3 border-t grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-muted-foreground">
                          {patient.expected_hospital_stay && (
                            <div>Stay: {patient.expected_hospital_stay} days</div>
                          )}
                          {patient.icu_days && patient.icu_days > 0 && (
                            <div>ICU: {patient.icu_days} days</div>
                          )}
                          {patient.insurance && (
                            <div>Insurance: {patient.insurance}</div>
                          )}
                          {patient.sms_service && (
                            <div className="text-green-600">SMS Enabled</div>
                          )}
                        </div>
                      </div>
                      
                      <Button variant="outline" size="sm" className="ml-4">
                        Select
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {onCancel && (
          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
