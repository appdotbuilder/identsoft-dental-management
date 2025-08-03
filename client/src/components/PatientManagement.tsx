
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { Patient, CreatePatientInput, Company } from '../../../server/src/schema';

interface PatientManagementProps {
  patients: Patient[];
  companies: Company[];
  selectedCompany: Company | null;
  onPatientsChange: (patients: Patient[]) => void;
}

export function PatientManagement({ patients, companies, selectedCompany, onPatientsChange }: PatientManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePatientInput>({
    company_id: selectedCompany?.id || 0,
    first_name: '',
    last_name: '',
    email: null,
    phone: '',
    date_of_birth: new Date(),
    address: '',
    insurance_number: null,
    emergency_contact: null
  });

  const filteredPatients = selectedCompany 
    ? patients.filter(p => p.company_id === selectedCompany.id)
    : patients;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    
    setIsLoading(true);
    try {
      const patientData = {
        ...formData,
        company_id: selectedCompany.id
      };
      const newPatient = await trpc.createPatient.mutate(patientData);
      onPatientsChange([...patients, newPatient]);
      setFormData({
        company_id: selectedCompany.id,
        first_name: '',
        last_name: '',
        email: null,
        phone: '',
        date_of_birth: new Date(),
        address: '',
        insurance_number: null,
        emergency_contact: null
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create patient:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAge = (birthDate: Date) => {
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      return age - 1;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">👥 Patients</h2>
          <p className="text-gray-600 mt-1">
            {selectedCompany 
              ? `Manage patients for ${selectedCompany.name}`
              : 'Manage all patients across clinics'
            }
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!selectedCompany}
            >
              ➕ Add New Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
              <DialogDescription>
                Register a new patient to {selectedCompany?.name || 'the clinic'}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreatePatientInput) => ({ ...prev, first_name: e.target.value }))
                      }
                      placeholder="Jane"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreatePatientInput) => ({ ...prev, last_name: e.target.value }))
                      }
                      placeholder="Doe"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreatePatientInput) => ({ ...prev, email: e.target.value || null }))
                    }
                    placeholder="jane.doe@email.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreatePatientInput) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date_of_birth">Date of Birth *</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth.toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreatePatientInput) => ({ ...prev, date_of_birth: new Date(e.target.value) }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreatePatientInput) => ({ ...prev, address: e.target.value }))
                    }
                    placeholder="123 Main Street, City, State"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="insurance_number">Insurance Number</Label>
                  <Input
                    id="insurance_number"
                    value={formData.insurance_number || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreatePatientInput) => ({ ...prev, insurance_number: e.target.value || null }))
                    }
                    placeholder="INS-123456789"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="emergency_contact">Emergency Contact</Label>
                  <Input
                    id="emergency_contact"
                    value={formData.emergency_contact || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreatePatientInput) => ({ ...prev, emergency_contact: e.target.value || null }))
                    }
                    placeholder="John Doe - (555) 987-6543"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Patient'}
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
              <p>Please select a clinic from the Clinics tab to manage patients.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Patients Grid */}
      {filteredPatients.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedCompany ? 'No patients registered yet' : 'No patients found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedCompany 
                ? 'Add your first patient to start managing appointments and treatments.'
                : 'Select a clinic to view and manage patients.'
              }
            </p>
            {selectedCompany && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Add Your First Patient</Button>
                </DialogTrigger>
              </Dialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient: Patient) => {
            const company = companies.find(c => c.id === patient.company_id);
            const age = calculateAge(patient.date_of_birth);
            
            return (
              <Card key={patient.id} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">👤</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {patient.first_name} {patient.last_name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Age: {age} years old
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">🏥</span>
                      <span>{company?.name || 'Unknown Clinic'}</span>
                    </div>
                    {patient.email && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">📧</span>
                        <span>{patient.email}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📞</span>
                      <span>{patient.phone}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📍</span>
                      <span className="truncate">{patient.address}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">🎂</span>
                      <span>{patient.date_of_birth.toLocaleDateString()}</span>
                    </div>
                    {patient.insurance_number && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">🆔</span>
                        <span>Ins: {patient.insurance_number}</span>
                      </div>
                    )}
                    {patient.emergency_contact && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">🚨</span>
                        <span className="truncate">{patient.emergency_contact}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-500 pt-2">
                      <span className="mr-2">📅</span>
                      <span>Registered: {patient.created_at.toLocaleDateString()}</span>
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
