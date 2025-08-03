
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import { CompanyManagement } from '@/components/CompanyManagement';
import { DoctorManagement } from '@/components/DoctorManagement';
import { PatientManagement } from '@/components/PatientManagement';
import { AppointmentManagement } from '@/components/AppointmentManagement';
import { CaseStudyManagement } from '@/components/CaseStudyManagement';
import { PrescriptionManagement } from '@/components/PrescriptionManagement';
import { InvoiceManagement } from '@/components/InvoiceManagement';
import { CampaignManagement } from '@/components/CampaignManagement';
import { Dashboard } from '@/components/Dashboard';
import type { Company, Doctor, Patient, Appointment } from '../../server/src/schema';

function App() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [companiesData, doctorsData, patientsData, appointmentsData] = await Promise.all([
        trpc.getCompanies.query(),
        trpc.getDoctors.query({}),
        trpc.getPatients.query({}),
        trpc.getAppointments.query({})
      ]);
      
      setCompanies(companiesData);
      setDoctors(doctorsData);
      setPatients(patientsData);
      setAppointments(appointmentsData);
      
      if (companiesData.length > 0 && !selectedCompany) {
        setSelectedCompany(companiesData[0]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCompany]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefreshData = () => {
    loadData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading iDentSoft...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🦷</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">iDentSoft</h1>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Dental Management System
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              {selectedCompany && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{selectedCompany.name}</span>
                </div>
              )}
              <Button 
                onClick={handleRefreshData}
                variant="outline"
                size="sm"
              >
                🔄 Refresh
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid grid-cols-9 w-full bg-white shadow-sm">
            <TabsTrigger value="dashboard" className="text-sm">📊 Dashboard</TabsTrigger>
            <TabsTrigger value="companies" className="text-sm">🏥 Clinics</TabsTrigger>
            <TabsTrigger value="doctors" className="text-sm">👨‍⚕️ Doctors</TabsTrigger>
            <TabsTrigger value="patients" className="text-sm">👥 Patients</TabsTrigger>
            <TabsTrigger value="appointments" className="text-sm">📅 Appointments</TabsTrigger>
            <TabsTrigger value="cases" className="text-sm">📋 Cases</TabsTrigger>
            <TabsTrigger value="prescriptions" className="text-sm">💊 Prescriptions</TabsTrigger>
            <TabsTrigger value="invoices" className="text-sm">💰 Billing</TabsTrigger>
            <TabsTrigger value="campaigns" className="text-sm">📧 Campaigns</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="dashboard" className="space-y-6">
              <Dashboard 
                companies={companies}
                doctors={doctors}
                patients={patients}
                appointments={appointments}
                selectedCompany={selectedCompany}
              />
            </TabsContent>

            <TabsContent value="companies" className="space-y-6">
              <CompanyManagement 
                companies={companies}
                onCompaniesChange={setCompanies}
                selectedCompany={selectedCompany}
                onSelectCompany={setSelectedCompany}
              />
            </TabsContent>

            <TabsContent value="doctors" className="space-y-6">
              <DoctorManagement 
                doctors={doctors}
                companies={companies}
                selectedCompany={selectedCompany}
                onDoctorsChange={setDoctors}
              />
            </TabsContent>

            <TabsContent value="patients" className="space-y-6">
              <PatientManagement 
                patients={patients}
                companies={companies}
                selectedCompany={selectedCompany}
                onPatientsChange={setPatients}
              />
            </TabsContent>

            <TabsContent value="appointments" className="space-y-6">
              <AppointmentManagement 
                appointments={appointments}
                doctors={doctors}
                patients={patients}
                selectedCompany={selectedCompany}
                onAppointmentsChange={setAppointments}
              />
            </TabsContent>

            <TabsContent value="cases" className="space-y-6">
              <CaseStudyManagement 
                doctors={doctors}
                patients={patients}
                selectedCompany={selectedCompany}
              />
            </TabsContent>

            <TabsContent value="prescriptions" className="space-y-6">
              <PrescriptionManagement 
                doctors={doctors}
                patients={patients}
                selectedCompany={selectedCompany}
              />
            </TabsContent>

            <TabsContent value="invoices" className="space-y-6">
              <InvoiceManagement 
                patients={patients}
                companies={companies}
                selectedCompany={selectedCompany}
              />
            </TabsContent>

            <TabsContent value="campaigns" className="space-y-6">
              <CampaignManagement 
                companies={companies}
                selectedCompany={selectedCompany}
              />
            </TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}

export default App;
