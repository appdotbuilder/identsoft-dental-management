
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import {
  createCompanyInputSchema,
  createDepartmentInputSchema,
  createDoctorInputSchema,
  createPatientInputSchema,
  createDoctorScheduleInputSchema,
  createAppointmentInputSchema,
  createCaseStudyInputSchema,
  createPrescriptionInputSchema,
  createLabReportInputSchema,
  createInvoiceInputSchema,
  createPaymentInputSchema,
  createCampaignInputSchema
} from './schema';

// Import handlers
import { createCompany } from './handlers/create_company';
import { getCompanies } from './handlers/get_companies';
import { createDepartment } from './handlers/create_department';
import { getDepartments } from './handlers/get_departments';
import { createDoctor } from './handlers/create_doctor';
import { getDoctors } from './handlers/get_doctors';
import { createPatient } from './handlers/create_patient';
import { getPatients } from './handlers/get_patients';
import { createDoctorSchedule } from './handlers/create_doctor_schedule';
import { getDoctorSchedules } from './handlers/get_doctor_schedules';
import { createAppointment } from './handlers/create_appointment';
import { getAppointments } from './handlers/get_appointments';
import { createCaseStudy } from './handlers/create_case_study';
import { getCaseStudies } from './handlers/get_case_studies';
import { createPrescription } from './handlers/create_prescription';
import { getPrescriptions } from './handlers/get_prescriptions';
import { createLabReport } from './handlers/create_lab_report';
import { getLabReports } from './handlers/get_lab_reports';
import { createInvoice } from './handlers/create_invoice';
import { getInvoices } from './handlers/get_invoices';
import { createPayment } from './handlers/create_payment';
import { getPayments } from './handlers/get_payments';
import { createCampaign } from './handlers/create_campaign';
import { getCampaigns } from './handlers/get_campaigns';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Company management
  createCompany: publicProcedure
    .input(createCompanyInputSchema)
    .mutation(({ input }) => createCompany(input)),
  getCompanies: publicProcedure
    .query(() => getCompanies()),

  // Department management
  createDepartment: publicProcedure
    .input(createDepartmentInputSchema)
    .mutation(({ input }) => createDepartment(input)),
  getDepartments: publicProcedure
    .input(z.object({ companyId: z.number().optional() }))
    .query(({ input }) => getDepartments(input.companyId)),

  // Doctor management
  createDoctor: publicProcedure
    .input(createDoctorInputSchema)
    .mutation(({ input }) => createDoctor(input)),
  getDoctors: publicProcedure
    .input(z.object({ companyId: z.number().optional(), departmentId: z.number().optional() }))
    .query(({ input }) => getDoctors(input.companyId, input.departmentId)),

  // Patient management
  createPatient: publicProcedure
    .input(createPatientInputSchema)
    .mutation(({ input }) => createPatient(input)),
  getPatients: publicProcedure
    .input(z.object({ companyId: z.number().optional() }))
    .query(({ input }) => getPatients(input.companyId)),

  // Doctor schedule management
  createDoctorSchedule: publicProcedure
    .input(createDoctorScheduleInputSchema)
    .mutation(({ input }) => createDoctorSchedule(input)),
  getDoctorSchedules: publicProcedure
    .input(z.object({ doctorId: z.number() }))
    .query(({ input }) => getDoctorSchedules(input.doctorId)),

  // Appointment management
  createAppointment: publicProcedure
    .input(createAppointmentInputSchema)
    .mutation(({ input }) => createAppointment(input)),
  getAppointments: publicProcedure
    .input(z.object({ doctorId: z.number().optional(), patientId: z.number().optional() }))
    .query(({ input }) => getAppointments(input.doctorId, input.patientId)),

  // Case study management
  createCaseStudy: publicProcedure
    .input(createCaseStudyInputSchema)
    .mutation(({ input }) => createCaseStudy(input)),
  getCaseStudies: publicProcedure
    .input(z.object({ patientId: z.number().optional(), doctorId: z.number().optional() }))
    .query(({ input }) => getCaseStudies(input.patientId, input.doctorId)),

  // Prescription management
  createPrescription: publicProcedure
    .input(createPrescriptionInputSchema)
    .mutation(({ input }) => createPrescription(input)),
  getPrescriptions: publicProcedure
    .input(z.object({ patientId: z.number().optional(), doctorId: z.number().optional() }))
    .query(({ input }) => getPrescriptions(input.patientId, input.doctorId)),

  // Lab report management
  createLabReport: publicProcedure
    .input(createLabReportInputSchema)
    .mutation(({ input }) => createLabReport(input)),
  getLabReports: publicProcedure
    .input(z.object({ patientId: z.number().optional(), doctorId: z.number().optional() }))
    .query(({ input }) => getLabReports(input.patientId, input.doctorId)),

  // Invoice management
  createInvoice: publicProcedure
    .input(createInvoiceInputSchema)
    .mutation(({ input }) => createInvoice(input)),
  getInvoices: publicProcedure
    .input(z.object({ patientId: z.number().optional(), companyId: z.number().optional() }))
    .query(({ input }) => getInvoices(input.patientId, input.companyId)),

  // Payment management
  createPayment: publicProcedure
    .input(createPaymentInputSchema)
    .mutation(({ input }) => createPayment(input)),
  getPayments: publicProcedure
    .input(z.object({ invoiceId: z.number().optional() }))
    .query(({ input }) => getPayments(input.invoiceId)),

  // Communication campaign management
  createCampaign: publicProcedure
    .input(createCampaignInputSchema)
    .mutation(({ input }) => createCampaign(input)),
  getCampaigns: publicProcedure
    .input(z.object({ companyId: z.number().optional() }))
    .query(({ input }) => getCampaigns(input.companyId)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`iDentSoft TRPC server listening at port: ${port}`);
}

start();
