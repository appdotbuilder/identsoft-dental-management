
import { z } from 'zod';

// Company/Clinic schema
export const companySchema = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  email: z.string().email(),
  license_number: z.string(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Company = z.infer<typeof companySchema>;

export const createCompanyInputSchema = z.object({
  name: z.string().min(1),
  address: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  license_number: z.string().min(1)
});

export type CreateCompanyInput = z.infer<typeof createCompanyInputSchema>;

// Department schema
export const departmentSchema = z.object({
  id: z.number(),
  company_id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Department = z.infer<typeof departmentSchema>;

export const createDepartmentInputSchema = z.object({
  company_id: z.number(),
  name: z.string().min(1),
  description: z.string().nullable().optional()
});

export type CreateDepartmentInput = z.infer<typeof createDepartmentInputSchema>;

// Doctor schema
export const doctorSchema = z.object({
  id: z.number(),
  company_id: z.number(),
  department_id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  specialization: z.string(),
  license_number: z.string(),
  is_active: z.boolean(),
  created_at: z.coerce.date()
});

export type Doctor = z.infer<typeof doctorSchema>;

export const createDoctorInputSchema = z.object({
  company_id: z.number(),
  department_id: z.number(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  specialization: z.string().min(1),
  license_number: z.string().min(1)
});

export type CreateDoctorInput = z.infer<typeof createDoctorInputSchema>;

// Patient schema
export const patientSchema = z.object({
  id: z.number(),
  company_id: z.number(),
  first_name: z.string(),
  last_name: z.string(),
  email: z.string().email().nullable(),
  phone: z.string(),
  date_of_birth: z.coerce.date(),
  address: z.string(),
  insurance_number: z.string().nullable(),
  emergency_contact: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Patient = z.infer<typeof patientSchema>;

export const createPatientInputSchema = z.object({
  company_id: z.number(),
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  email: z.string().email().nullable().optional(),
  phone: z.string().min(1),
  date_of_birth: z.coerce.date(),
  address: z.string().min(1),
  insurance_number: z.string().nullable().optional(),
  emergency_contact: z.string().nullable().optional()
});

export type CreatePatientInput = z.infer<typeof createPatientInputSchema>;

// Doctor Schedule schema
export const doctorScheduleSchema = z.object({
  id: z.number(),
  doctor_id: z.number(),
  day_of_week: z.number().int().min(0).max(6), // 0 = Sunday, 6 = Saturday
  start_time: z.string(), // Format: "HH:MM"
  end_time: z.string(), // Format: "HH:MM"
  is_available: z.boolean(),
  created_at: z.coerce.date()
});

export type DoctorSchedule = z.infer<typeof doctorScheduleSchema>;

export const createDoctorScheduleInputSchema = z.object({
  doctor_id: z.number(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
});

export type CreateDoctorScheduleInput = z.infer<typeof createDoctorScheduleInputSchema>;

// Appointment schema
export const appointmentSchema = z.object({
  id: z.number(),
  patient_id: z.number(),
  doctor_id: z.number(),
  appointment_date: z.coerce.date(),
  appointment_time: z.string(),
  status: z.enum(['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled']),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Appointment = z.infer<typeof appointmentSchema>;

export const createAppointmentInputSchema = z.object({
  patient_id: z.number(),
  doctor_id: z.number(),
  appointment_date: z.coerce.date(),
  appointment_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  notes: z.string().nullable().optional()
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentInputSchema>;

// Case Study schema
export const caseStudySchema = z.object({
  id: z.number(),
  patient_id: z.number(),
  doctor_id: z.number(),
  title: z.string(),
  diagnosis: z.string(),
  treatment_plan: z.string(),
  notes: z.string().nullable(),
  status: z.enum(['active', 'completed', 'on_hold']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type CaseStudy = z.infer<typeof caseStudySchema>;

export const createCaseStudyInputSchema = z.object({
  patient_id: z.number(),
  doctor_id: z.number(),
  title: z.string().min(1),
  diagnosis: z.string().min(1),
  treatment_plan: z.string().min(1),
  notes: z.string().nullable().optional()
});

export type CreateCaseStudyInput = z.infer<typeof createCaseStudyInputSchema>;

// Prescription schema
export const prescriptionSchema = z.object({
  id: z.number(),
  patient_id: z.number(),
  doctor_id: z.number(),
  case_study_id: z.number().nullable(),
  medication_name: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  duration: z.string(),
  instructions: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Prescription = z.infer<typeof prescriptionSchema>;

export const createPrescriptionInputSchema = z.object({
  patient_id: z.number(),
  doctor_id: z.number(),
  case_study_id: z.number().nullable().optional(),
  medication_name: z.string().min(1),
  dosage: z.string().min(1),
  frequency: z.string().min(1),
  duration: z.string().min(1),
  instructions: z.string().nullable().optional()
});

export type CreatePrescriptionInput = z.infer<typeof createPrescriptionInputSchema>;

// Lab Report schema
export const labReportSchema = z.object({
  id: z.number(),
  patient_id: z.number(),
  doctor_id: z.number(),
  case_study_id: z.number().nullable(),
  test_name: z.string(),
  test_date: z.coerce.date(),
  results: z.string(),
  notes: z.string().nullable(),
  file_path: z.string().nullable(),
  status: z.enum(['pending', 'completed', 'reviewed']),
  created_at: z.coerce.date()
});

export type LabReport = z.infer<typeof labReportSchema>;

export const createLabReportInputSchema = z.object({
  patient_id: z.number(),
  doctor_id: z.number(),
  case_study_id: z.number().nullable().optional(),
  test_name: z.string().min(1),
  test_date: z.coerce.date(),
  results: z.string().min(1),
  notes: z.string().nullable().optional(),
  file_path: z.string().nullable().optional()
});

export type CreateLabReportInput = z.infer<typeof createLabReportInputSchema>;

// Invoice schema
export const invoiceSchema = z.object({
  id: z.number(),
  patient_id: z.number(),
  company_id: z.number(),
  invoice_number: z.string(),
  total_amount: z.number(),
  paid_amount: z.number(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  due_date: z.coerce.date(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Invoice = z.infer<typeof invoiceSchema>;

export const createInvoiceInputSchema = z.object({
  patient_id: z.number(),
  company_id: z.number(),
  total_amount: z.number().positive(),
  due_date: z.coerce.date(),
  notes: z.string().nullable().optional()
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceInputSchema>;

// Payment schema
export const paymentSchema = z.object({
  id: z.number(),
  invoice_id: z.number(),
  amount: z.number(),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'insurance']),
  payment_date: z.coerce.date(),
  reference_number: z.string().nullable(),
  notes: z.string().nullable(),
  created_at: z.coerce.date()
});

export type Payment = z.infer<typeof paymentSchema>;

export const createPaymentInputSchema = z.object({
  invoice_id: z.number(),
  amount: z.number().positive(),
  payment_method: z.enum(['cash', 'card', 'bank_transfer', 'insurance']),
  payment_date: z.coerce.date(),
  reference_number: z.string().nullable().optional(),
  notes: z.string().nullable().optional()
});

export type CreatePaymentInput = z.infer<typeof createPaymentInputSchema>;

// Communication Campaign schema
export const campaignSchema = z.object({
  id: z.number(),
  company_id: z.number(),
  name: z.string(),
  type: z.enum(['email', 'sms']),
  subject: z.string().nullable(),
  message: z.string(),
  status: z.enum(['draft', 'scheduled', 'sent', 'failed']),
  scheduled_date: z.coerce.date().nullable(),
  sent_date: z.coerce.date().nullable(),
  recipient_count: z.number().int(),
  created_at: z.coerce.date()
});

export type Campaign = z.infer<typeof campaignSchema>;

export const createCampaignInputSchema = z.object({
  company_id: z.number(),
  name: z.string().min(1),
  type: z.enum(['email', 'sms']),
  subject: z.string().nullable().optional(),
  message: z.string().min(1),
  scheduled_date: z.coerce.date().nullable().optional()
});

export type CreateCampaignInput = z.infer<typeof createCampaignInputSchema>;
