
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Company, Doctor, Patient, Appointment } from '../../../server/src/schema';

interface DashboardProps {
  companies: Company[];
  doctors: Doctor[];
  patients: Patient[];
  appointments: Appointment[];
  selectedCompany: Company | null;
}

export function Dashboard({ companies, doctors, patients, appointments, selectedCompany }: DashboardProps) {
  const filteredDoctors = selectedCompany 
    ? doctors.filter(d => d.company_id === selectedCompany.id)
    : doctors;
  
  const filteredPatients = selectedCompany 
    ? patients.filter(p => p.company_id === selectedCompany.id)
    : patients;

  const todaysAppointments = appointments.filter(apt => {
    const today = new Date().toISOString().split('T')[0];
    const aptDate = apt.appointment_date.toISOString().split('T')[0];
    return aptDate === today;
  });

  const upcomingAppointments = appointments.filter(apt => {
    const today = new Date();
    const aptDate = new Date(apt.appointment_date);
    return aptDate > today && apt.status === 'scheduled';
  });

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

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            🦷 Welcome to iDentSoft
          </CardTitle>
          <CardDescription className="text-blue-100">
            {selectedCompany 
              ? `Managing ${selectedCompany.name} - Your comprehensive dental clinic management solution`
              : 'Your comprehensive dental clinic management solution'
            }
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clinics</CardTitle>
            <span className="text-2xl">🏥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{companies.length}</div>
            <p className="text-xs text-muted-foreground">
              Active dental clinics
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedCompany ? 'Clinic Doctors' : 'Total Doctors'}
            </CardTitle>
            <span className="text-2xl">👨‍⚕️</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{filteredDoctors.length}</div>
            <p className="text-xs text-muted-foreground">
              Active practitioners
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {selectedCompany ? 'Clinic Patients' : 'Total Patients'}
            </CardTitle>
            <span className="text-2xl">👥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{filteredPatients.length}</div>
            <p className="text-xs text-muted-foreground">
              Registered patients
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <span className="text-2xl">📅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{todaysAppointments.length}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled for today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📅 Today's Appointments
            </CardTitle>
            <CardDescription>
              All appointments scheduled for today
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todaysAppointments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No appointments today</p>
            ) : (
              <div className="space-y-3">
                {todaysAppointments.slice(0, 5).map((appointment: Appointment) => {
                  const doctor = doctors.find(d => d.id === appointment.doctor_id);
                  const patient = patients.find(p => p.id === appointment.patient_id);
                  
                  return (
                    <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">
                          {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient'}
                        </p>
                        <p className="text-xs text-gray-600">
                          Dr. {doctor ? `${doctor.first_name} ${doctor.last_name}` : 'Unknown Doctor'} • {appointment.appointment_time}
                        </p>
                      </div>
                      <Badge className={getStatusColor(appointment.status)}>
                        {appointment.status}
                      </Badge>
                    </div>
                  );
                })}
                {todaysAppointments.length > 5 && (
                  <p className="text-sm text-gray-500 text-center pt-2">
                    +{todaysAppointments.length - 5} more appointments
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⏰ Upcoming Appointments
            </CardTitle>
            <CardDescription>
              Next scheduled appointments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No upcoming appointments</p>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 5).map((appointment: Appointment) => {
                  const doctor = doctors.find(d => d.id === appointment.doctor_id);
                  const patient = patients.find(p => p.id === appointment.patient_id);
                  
                  return (
                    <div key={appointment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">
                          {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient'}
                        </p>
                        <p className="text-xs text-gray-600">
                          {appointment.appointment_date.toLocaleDateString()} at {appointment.appointment_time}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600">
                          Dr. {doctor ? `${doctor.first_name} ${doctor.last_name}` : 'Unknown'}
                        </p>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
                {upcomingAppointments.length > 5 && (
                  <p className="text-sm text-gray-500 text-center pt-2">
                    +{upcomingAppointments.length - 5} more appointments
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ⚡ Quick Actions
          </CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <span className="text-2xl">👥</span>
              <span className="text-sm">Add Patient</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <span className="text-2xl">📅</span>
              <span className="text-sm">Schedule Appointment</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <span className="text-2xl">💊</span>
              <span className="text-sm">New Prescription</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <span className="text-2xl">💰</span>
              <span className="text-sm">Create Invoice</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
