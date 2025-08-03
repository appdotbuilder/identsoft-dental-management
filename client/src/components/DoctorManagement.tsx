
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { trpc } from '@/utils/trpc';
import { useState, useEffect } from 'react';
import type { Doctor, CreateDoctorInput, Company, Department } from '../../../server/src/schema';

interface DoctorManagementProps {
  doctors: Doctor[];
  companies: Company[];
  selectedCompany: Company | null;
  onDoctorsChange: (doctors: Doctor[]) => void;
}

export function DoctorManagement({ doctors, companies, selectedCompany, onDoctorsChange }: DoctorManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState<CreateDoctorInput>({
    company_id: selectedCompany?.id || 0,
    department_id: 0,
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    specialization: '',
    license_number: ''
  });

  const filteredDoctors = selectedCompany 
    ? doctors.filter(d => d.company_id === selectedCompany.id)
    : doctors;

  // Load departments when company is selected
  useEffect(() => {
    const loadDepartments = async () => {
      if (selectedCompany) {
        try {
          const deps = await trpc.getDepartments.query({ companyId: selectedCompany.id });
          setDepartments(deps);
        } catch (error) {
          console.error('Failed to load departments:', error);
        }
      }
    };
    loadDepartments();
  }, [selectedCompany]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    
    setIsLoading(true);
    try {
      const doctorData = {
        ...formData,
        company_id: selectedCompany.id
      };
      const newDoctor = await trpc.createDoctor.mutate(doctorData);
      onDoctorsChange([...doctors, newDoctor]);
      setFormData({
        company_id: selectedCompany.id,
        department_id: 0,
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        specialization: '',
        license_number: ''
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create doctor:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <Badge className="bg-green-100 text-green-800">Active</Badge>
      : <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">👨‍⚕️ Doctors</h2>
          <p className="text-gray-600 mt-1">
            {selectedCompany 
              ? `Manage doctors for ${selectedCompany.name}`
              : 'Manage all doctors across clinics'
            }
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              disabled={!selectedCompany}
            >
              ➕ Add New Doctor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Doctor</DialogTitle>
              <DialogDescription>
                Add a new doctor to {selectedCompany?.name || 'the clinic'}.
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
                        setFormData((prev: CreateDoctorInput) => ({ ...prev, first_name: e.target.value }))
                      }
                      placeholder="John"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateDoctorInput) => ({ ...prev, last_name: e.target.value }))
                      }
                      placeholder="Smith"
                      required
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateDoctorInput) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="dr.smith@clinic.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateDoctorInput) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="specialization">Specialization *</Label>
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateDoctorInput) => ({ ...prev, specialization: e.target.value }))
                    }
                    placeholder="e.g. General Dentistry, Orthodontics"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="license_number">License Number *</Label>
                  <Input
                    id="license_number"
                    value={formData.license_number}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateDoctorInput) => ({ ...prev, license_number: e.target.value }))
                    }
                    placeholder="MD-12345-2024"
                    required
                  />
                </div>
                {departments.length > 0 && (
                  <div className="grid gap-2">
                    <Label>Department</Label>
                    <Select
                      value={formData.department_id.toString()}
                      onValueChange={(value: string) =>
                        setFormData((prev: CreateDoctorInput) => ({ ...prev, department_id: parseInt(value) }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {departments.map((dept: Department) => (
                          <SelectItem key={dept.id} value={dept.id.toString()}>
                            {dept.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Adding...' : 'Add Doctor'}
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
              <p>Please select a clinic from the Clinics tab to manage doctors.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Doctors Grid */}
      {filteredDoctors.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">👨‍⚕️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedCompany ? 'No doctors in this clinic yet' : 'No doctors registered'}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedCompany 
                ? 'Add your first doctor to start managing appointments and treatments.'
                : 'Select a clinic to view and manage doctors.'
              }
            </p>
            {selectedCompany && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Add Your First Doctor</Button>
                </DialogTrigger>
              </Dialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doctor: Doctor) => {
            const company = companies.find(c => c.id === doctor.company_id);
            const department = departments.find(d => d.id === doctor.department_id);
            
            return (
              <Card key={doctor.id} className="hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">👨‍⚕️</span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Dr. {doctor.first_name} {doctor.last_name}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {doctor.specialization}
                        </CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(doctor.is_active)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">🏥</span>
                      <span>{company?.name || 'Unknown Clinic'}</span>
                    </div>
                    {department && (
                      <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">🏢</span>
                        <span>{department.name}</span>
                      </div>
                    )}
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📧</span>
                      <span>{doctor.email}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">📞</span>
                      <span>{doctor.phone}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="mr-2">🆔</span>
                      <span>License: {doctor.license_number}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 pt-2">
                      <span className="mr-2">📅</span>
                      <span>Joined: {doctor.created_at.toLocaleDateString()}</span>
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
