
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import { useState, useEffect } from 'react';
import type { Prescription, CreatePrescriptionInput, Doctor, Patient, Company } from '../../../server/src/schema';

interface PrescriptionManagementProps {
  doctors: Doctor[];
  patients: Patient[];
  selectedCompany: Company | null;
}

export function PrescriptionManagement({ doctors, patients, selectedCompany }: PrescriptionManagementProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePrescriptionInput>({
    patient_id: 0,
    doctor_id: 0,
    case_study_id: null,
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: null
  });

  const filteredDoctors = selectedCompany 
    ? doctors.filter(d => d.company_id === selectedCompany.id)
    : doctors;
  
  const filteredPatients = selectedCompany 
    ? patients.filter(p => p.company_id === selectedCompany.id)
    : patients;

  useEffect(() => {
    const loadPrescriptions = async () => {
      try {
        const data = await trpc.getPrescriptions.query({});
        setPrescriptions(data);
      } catch (error) {
        console.error('Failed to load prescriptions:', error);
      }
    };
    loadPrescriptions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    
    setIsLoading(true);
    try {
      const newPrescription = await trpc.createPrescription.mutate(formData);
      setPrescriptions([...prescriptions, newPrescription]);
      setFormData({
        patient_id: 0,
        doctor_id: 0,
        case_study_id: null,
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: null
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create prescription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    if (!selectedCompany) return true;
    const doctor = doctors.find(d => d.id === p.doctor_id);
    const patient = patients.find(pt => pt.id === p.patient_id);
    return doctor?.company_id === selectedCompany.id || patient?.company_id === selectedCompany.id;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">💊 Prescriptions</h2>
          <p className="text-gray-600 mt-1">
            {selectedCompany 
              ? `Manage prescriptions for ${selectedCompany.name}`
              : 'Manage patient prescriptions and medications'
            }
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-pink-600 hover:bg-pink-700"
              disabled={!selectedCompany || filteredDoctors.length === 0 || filteredPatients.length === 0}
            >
              ➕ New Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Prescription</DialogTitle>
              <DialogDescription>
                Write a new prescription for a patient.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Patient *</Label>
                    <Select
                      value={formData.patient_id.toString()}
                      onValueChange={(value: string) =>
                        setFormData((prev: CreatePrescriptionInput) => ({ ...prev, patient_id: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredPatients.map((patient: Patient) => (
                          <SelectItem key={patient.id} value={patient.id.toString()}>
                            {patient.first_name} {patient.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Doctor *</Label>
                    <Select
                      value={formData.doctor_id.toString()}
                      onValueChange={(value: string) =>
                        setFormData((prev: CreatePrescriptionInput) => ({ ...prev, doctor_id: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDoctors.map((doctor: Doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id.toString()}>
                            Dr. {doctor.first_name} {doctor.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="medication_name">Medication Name *</Label>
                  <Input
                    id="medication_name"
                    value={formData.medication_name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreatePrescriptionInput) => ({ ...prev, medication_name: e.target.value }))
                    }
                    placeholder="e.g. Amoxicillin"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="dosage">Dosage *</Label>
                    <Input
                      id="dosage"
                      value={formData.dosage}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreatePrescriptionInput) => ({ ...prev, dosage: e.target.value }))
                      }
                      placeholder="e.g. 500mg"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="frequency">Frequency *</Label>
                    <Input
                      id="frequency"
                      value={formData.frequency}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreatePrescriptionInput) => ({ ...prev, frequency: e.target.value }))
                      }
                      placeholder="e.g. 3 times daily"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration">Duration *</Label>
                  <Input
                    id="duration"
                    value={formData.duration}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreatePrescriptionInput) => ({ ...prev, duration: e.target.value }))
                    }
                    placeholder="e.g. 7 days"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="instructions">Special Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={formData.instructions || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreatePrescriptionInput) => ({ ...prev, instructions: e.target.value || null }))
                    }
                    placeholder="Take with food, avoid alcohol, etc..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Prescription'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!selectedCompany && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-800">
              <span>⚠️</span>
              <p>Please select a clinic from the Clinics tab to manage prescriptions.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prescriptions List */}
      {filteredPrescriptions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">💊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedCompany ? 'No prescriptions written yet' : 'No prescriptions found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedCompany && filteredDoctors.length > 0 && filteredPatients.length > 0
                ? 'Write your first prescription to get started.'
                : 'Select a clinic and ensure you have doctors and patients registered.'
              }
            </p>
            {selectedCompany && filteredDoctors.length > 0 && filteredPatients.length > 0 && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Write Your First Prescription</Button>
                </DialogTrigger>
              </Dialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPrescriptions.map((prescription: Prescription) => {
            const doctor = doctors.find(d => d.id === prescription.doctor_id);
            const patient = patients.find(p => p.id === prescription.patient_id);
            
            return (
              <Card key={prescription.id} className="hover:shadow-md transition-all">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">💊</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{prescription.medication_name}</CardTitle>
                      <CardDescription>
                        For: {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient'}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs font-medium text-gray-600 mb-1">DOSAGE</p>
                        <p className="text-sm font-semibold">{prescription.dosage}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-xs font-medium text-gray-600 mb-1">FREQUENCY</p>
                        <p className="text-sm font-semibold">{prescription.frequency}</p>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-xs font-medium text-blue-600 mb-1">DURATION</p>
                      <p className="text-sm font-semibold text-blue-800">{prescription.duration}</p>
                    </div>
                    {prescription.instructions && (
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <p className="text-xs font-medium text-yellow-600 mb-1">SPECIAL INSTRUCTIONS</p>
                        <p className="text-sm text-yellow-800">{prescription.instructions}</p>
                      </div>
                    )}
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>👨‍⚕️ Dr. {doctor ? `${doctor.first_name} ${doctor.last_name}` : 'Unknown'}</span>
                        <span>📅 {prescription.created_at.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
