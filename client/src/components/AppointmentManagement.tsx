
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { Appointment, CreateAppointmentInput, Doctor, Patient, Company } from '../../../server/src/schema';

interface AppointmentManagementProps {
  appointments: Appointment[];
  doctors: Doctor[];
  patients: Patient[];
  selectedCompany: Company | null;
  onAppointmentsChange: (appointments: Appointment[]) => void;
}

export function AppointmentManagement({ 
  appointments, 
  doctors, 
  patients, 
  selectedCompany, 
  onAppointmentsChange 
}: AppointmentManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateAppointmentInput>({
    patient_id: 0,
    doctor_id: 0,
    appointment_date: new Date(),
    appointment_time: '09:00',
    notes: null
  });

  const filteredDoctors = selectedCompany 
    ? doctors.filter(d => d.company_id === selectedCompany.id)
    : doctors;
  
  const filteredPatients = selectedCompany 
    ? patients.filter(p => p.company_id === selectedCompany.id)
    : patients;

  const filteredAppointments = appointments.filter(apt => {
    if (!selectedCompany) return true;
    const doctor = doctors.find(d => d.id === apt.doctor_id);
    return doctor?.company_id === selectedCompany.id;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    
    setIsLoading(true);
    try {
      const newAppointment = await trpc.createAppointment.mutate(formData);
      onAppointmentsChange([...appointments, newAppointment]);
      setFormData({
        patient_id: 0,
        doctor_id: 0,
        appointment_date: new Date(),
        appointment_time: '09:00',
        notes: null
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create appointment:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    const dateA = new Date(`${a.appointment_date.toISOString().split('T')[0]}T${a.appointment_time}`);
    const dateB = new Date(`${b.appointment_date.toISOString().split('T')[0]}T${b.appointment_time}`);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">📅 Appointments</h2>
          <p className="text-gray-600 mt-1">
            {selectedCompany 
              ? `Manage appointments for ${selectedCompany.name}`
              : 'Manage all appointments across clinics'
            }
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-orange-600 hover:bg-orange-700"
              disabled={!selectedCompany || filteredDoctors.length === 0 || filteredPatients.length === 0}
            >
              ➕ Schedule Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
              <DialogDescription>
                Create a new appointment for {selectedCompany?.name || 'the clinic'}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Patient *</Label>
                  <Select
                    value={formData.patient_id.toString()}
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateAppointmentInput) => ({ ...prev, patient_id: parseInt(value) }))
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
                      setFormData((prev: CreateAppointmentInput) => ({ ...prev, doctor_id: parseInt(value) }))
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
                  <Label htmlFor="appointment_date">Appointment Date *</Label>
                  <Input
                    id="appointment_date"
                    type="date"
                    value={formData.appointment_date.toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateAppointmentInput) => ({ ...prev, appointment_date: new Date(e.target.value) }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="appointment_time">Appointment Time *</Label>
                  <Input
                    id="appointment_time"
                    type="time"
                    value={formData.appointment_time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateAppointmentInput) => ({ ...prev, appointment_time: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateAppointmentInput) => ({ ...prev, notes: e.target.value || null }))
                    }
                    placeholder="Any special instructions or notes..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Scheduling...' : 'Schedule Appointment'}
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
              <p>Please select a clinic from the Clinics tab to manage appointments.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredDoctors.length === 0 && selectedCompany && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-800">
              <span>⚠️</span>
              <p>No doctors available. Please add doctors first to schedule appointments.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {filteredPatients.length === 0 && selectedCompany && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-800">
              <span>⚠️</span>
              <p>No patients registered. Please add patients first to schedule appointments.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appointments List */}
      {sortedAppointments.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">📅</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedCompany ? 'No appointments scheduled yet' : 'No appointments found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedCompany && filteredDoctors.length > 0 && filteredPatients.length > 0
                ? 'Schedule your first appointment to get started.'
                : 'Select a clinic and ensure you have doctors and patients registered.'
              }
            </p>
            {selectedCompany && filteredDoctors.length > 0 && filteredPatients.length > 0 && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Schedule Your First Appointment</Button>
                </DialogTrigger>
              </Dialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedAppointments.map((appointment: Appointment) => {
            const doctor = doctors.find(d => d.id === appointment.doctor_id);
            const patient = patients.find(p => p.id === appointment.patient_id);
            const isToday = appointment.appointment_date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
            const isPast = appointment.appointment_date < new Date();
            
            return (
              <Card key={appointment.id} className={`hover:shadow-md transition-all ${isToday ? 'border-orange-200 bg-orange-50' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">📅</span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient'}
                        </CardTitle>
                        <CardDescription>
                          with Dr. {doctor ? `${doctor.first_name} ${doctor.last_name}` : 'Unknown Doctor'}
                          {doctor?.specialization && ` (${doctor.specialization})`}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isToday && <Badge className="bg-orange-100 text-orange-800">Today</Badge>}
                      {isPast && appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                        <Badge className="bg-red-100 text-red-800">Overdue</Badge>
                      )}
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Date & Time</p>
                      <p className="text-sm text-gray-600">
                        📅 {appointment.appointment_date.toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        🕐 {appointment.appointment_time}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Contact</p>
                      {patient && (
                        <>
                          <p className="text-sm text-gray-600">📞 {patient.phone}</p>
                          {patient.email && <p className="text-sm text-gray-600">📧 {patient.email}</p>}
                        </>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-1">Details</p>
                      <p className="text-sm text-gray-600">
                        Created: {appointment.created_at.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {appointment.notes && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                      <p className="text-sm text-gray-600">{appointment.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
