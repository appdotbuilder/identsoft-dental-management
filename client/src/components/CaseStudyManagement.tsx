
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import { useState, useEffect } from 'react';
import type { CaseStudy, CreateCaseStudyInput, Doctor, Patient, Company } from '../../../server/src/schema';

interface CaseStudyManagementProps {
  doctors: Doctor[];
  patients: Patient[];
  selectedCompany: Company | null;
}

export function CaseStudyManagement({ doctors, patients, selectedCompany }: CaseStudyManagementProps) {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCaseStudyInput>({
    patient_id: 0,
    doctor_id: 0,
    title: '',
    diagnosis: '',
    treatment_plan: '',
    notes: null
  });

  const filteredDoctors = selectedCompany 
    ? doctors.filter(d => d.company_id === selectedCompany.id)
    : doctors;
  
  const filteredPatients = selectedCompany 
    ? patients.filter(p => p.company_id === selectedCompany.id)
    : patients;

  useEffect(() => {
    const loadCaseStudies = async () => {
      try {
        const data = await trpc.getCaseStudies.query({});
        setCaseStudies(data);
      } catch (error) {
        console.error('Failed to load case studies:', error);
      }
    };
    loadCaseStudies();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    
    setIsLoading(true);
    try {
      const newCaseStudy = await trpc.createCaseStudy.mutate(formData);
      setCaseStudies([...caseStudies, newCaseStudy]);
      setFormData({
        patient_id: 0,
        doctor_id: 0,
        title: '',
        diagnosis: '',
        treatment_plan: '',
        notes: null
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create case study:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredCaseStudies = caseStudies.filter(cs => {
    if (!selectedCompany) return true;
    const doctor = doctors.find(d => d.id === cs.doctor_id);
    const patient = patients.find(p => p.id === cs.patient_id);
    return doctor?.company_id === selectedCompany.id || patient?.company_id === selectedCompany.id;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">📋 Case Studies</h2>
          <p className="text-gray-600 mt-1">
            {selectedCompany 
              ? `Manage patient case studies for ${selectedCompany.name}`
              : 'Manage patient case studies and treatment plans'
            }
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={!selectedCompany || filteredDoctors.length === 0 || filteredPatients.length === 0}
            >
              ➕ New Case Study
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Case Study</DialogTitle>
              <DialogDescription>
                Document a new patient case study and treatment plan.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Patient *</Label>
                  <Select
                    value={formData.patient_id.toString()}
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateCaseStudyInput) => ({ ...prev, patient_id: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a patient" />
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
                      setFormData((prev: CreateCaseStudyInput) => ({ ...prev, doctor_id: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a doctor" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredDoctors.map((doctor: Doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id.toString()}>
                          Dr. {doctor.first_name} {doctor.last_name} - {doctor.specialization}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="title">Case Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCaseStudyInput) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="e.g. Root Canal Treatment - Tooth #14"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="diagnosis">Diagnosis *</Label>
                  <Textarea
                    id="diagnosis"
                    value={formData.diagnosis}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateCaseStudyInput) => ({ ...prev, diagnosis: e.target.value }))
                    }
                    placeholder="Describe the patient's condition and findings..."
                    rows={3}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="treatment_plan">Treatment Plan *</Label>
                  <Textarea
                    id="treatment_plan"
                    value={formData.treatment_plan}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateCaseStudyInput) => ({ ...prev, treatment_plan: e.target.value }))
                    }
                    placeholder="Outline the planned treatment approach..."
                    rows={3}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Additional Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateCaseStudyInput) => ({ ...prev, notes: e.target.value || null }))
                    }
                    placeholder="Any additional observations or notes..."
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Case Study'}
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
              <p>Please select a clinic from the Clinics tab to manage case studies.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Case Studies List */}
      {filteredCaseStudies.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedCompany ? 'No case studies documented yet' : 'No case studies found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedCompany && filteredDoctors.length > 0 && filteredPatients.length > 0
                ? 'Create your first case study to start documenting patient treatments.'
                : 'Select a clinic and ensure you have doctors and patients registered.'
              }
            </p>
            {selectedCompany && filteredDoctors.length > 0 && filteredPatients.length > 0 && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Create Your First Case Study</Button>
                </DialogTrigger>
              </Dialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredCaseStudies.map((caseStudy: CaseStudy) => {
            const doctor = doctors.find(d => d.id === caseStudy.doctor_id);
            const patient = patients.find(p => p.id === caseStudy.patient_id);
            
            return (
              <Card key={caseStudy.id} className="hover:shadow-md transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📋</span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{caseStudy.title}</CardTitle>
                        <CardDescription>
                          Patient: {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient'} | 
                          Doctor: Dr. {doctor ? `${doctor.first_name} ${doctor.last_name}` : 'Unknown Doctor'}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(caseStudy.status)}>
                      {caseStudy.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">📋 Diagnosis</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                        {caseStudy.diagnosis}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">🎯 Treatment Plan</h4>
                      <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                        {caseStudy.treatment_plan}
                      </p>
                    </div>
                    {caseStudy.notes && (
                      <div>
                        <h4 className="font-semibold text-sm text-gray-700 mb-2">📝 Additional Notes</h4>
                        <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg">
                          {caseStudy.notes}
                        </p>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
                      <span>Created: {caseStudy.created_at.toLocaleDateString()}</span>
                      <span>Last Updated: {caseStudy.updated_at.toLocaleDateString()}</span>
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
