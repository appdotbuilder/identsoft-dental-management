
import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum, date, time } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const appointmentStatusEnum = pgEnum('appointment_status', ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled']);
export const caseStudyStatusEnum = pgEnum('case_study_status', ['active', 'completed', 'on_hold']);
export const labReportStatusEnum = pgEnum('lab_report_status', ['pending', 'completed', 'reviewed']);
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue', 'cancelled']);
export const paymentMethodEnum = pgEnum('payment_method', ['cash', 'card', 'bank_transfer', 'insurance']);
export const campaignTypeEnum = pgEnum('campaign_type', ['email', 'sms']);
export const campaignStatusEnum = pgEnum('campaign_status', ['draft', 'scheduled', 'sent', 'failed']);

// Companies table
export const companiesTable = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  license_number: text('license_number').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Departments table
export const departmentsTable = pgTable('departments', {
  id: serial('id').primaryKey(),
  company_id: integer('company_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Doctors table
export const doctorsTable = pgTable('doctors', {
  id: serial('id').primaryKey(),
  company_id: integer('company_id').notNull(),
  department_id: integer('department_id').notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  specialization: text('specialization').notNull(),
  license_number: text('license_number').notNull(),
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Patients table
export const patientsTable = pgTable('patients', {
  id: serial('id').primaryKey(),
  company_id: integer('company_id').notNull(),
  first_name: text('first_name').notNull(),
  last_name: text('last_name').notNull(),
  email: text('email'),
  phone: text('phone').notNull(),
  date_of_birth: date('date_of_birth').notNull(),
  address: text('address').notNull(),
  insurance_number: text('insurance_number'),
  emergency_contact: text('emergency_contact'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Doctor schedules table
export const doctorSchedulesTable = pgTable('doctor_schedules', {
  id: serial('id').primaryKey(),
  doctor_id: integer('doctor_id').notNull(),
  day_of_week: integer('day_of_week').notNull(), // 0 = Sunday, 6 = Saturday
  start_time: time('start_time').notNull(),
  end_time: time('end_time').notNull(),
  is_available: boolean('is_available').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Appointments table
export const appointmentsTable = pgTable('appointments', {
  id: serial('id').primaryKey(),
  patient_id: integer('patient_id').notNull(),
  doctor_id: integer('doctor_id').notNull(),
  appointment_date: date('appointment_date').notNull(),
  appointment_time: time('appointment_time').notNull(),
  status: appointmentStatusEnum('status').default('scheduled').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Case studies table
export const caseStudiesTable = pgTable('case_studies', {
  id: serial('id').primaryKey(),
  patient_id: integer('patient_id').notNull(),
  doctor_id: integer('doctor_id').notNull(),
  title: text('title').notNull(),
  diagnosis: text('diagnosis').notNull(),
  treatment_plan: text('treatment_plan').notNull(),
  notes: text('notes'),
  status: caseStudyStatusEnum('status').default('active').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Prescriptions table
export const prescriptionsTable = pgTable('prescriptions', {
  id: serial('id').primaryKey(),
  patient_id: integer('patient_id').notNull(),
  doctor_id: integer('doctor_id').notNull(),
  case_study_id: integer('case_study_id'),
  medication_name: text('medication_name').notNull(),
  dosage: text('dosage').notNull(),
  frequency: text('frequency').notNull(),
  duration: text('duration').notNull(),
  instructions: text('instructions'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Lab reports table
export const labReportsTable = pgTable('lab_reports', {
  id: serial('id').primaryKey(),
  patient_id: integer('patient_id').notNull(),
  doctor_id: integer('doctor_id').notNull(),
  case_study_id: integer('case_study_id'),
  test_name: text('test_name').notNull(),
  test_date: date('test_date').notNull(),
  results: text('results').notNull(),
  notes: text('notes'),
  file_path: text('file_path'),
  status: labReportStatusEnum('status').default('pending').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Invoices table
export const invoicesTable = pgTable('invoices', {
  id: serial('id').primaryKey(),
  patient_id: integer('patient_id').notNull(),
  company_id: integer('company_id').notNull(),
  invoice_number: text('invoice_number').notNull(),
  total_amount: numeric('total_amount', { precision: 10, scale: 2 }).notNull(),
  paid_amount: numeric('paid_amount', { precision: 10, scale: 2 }).default('0').notNull(),
  status: invoiceStatusEnum('status').default('draft').notNull(),
  due_date: date('due_date').notNull(),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Payments table
export const paymentsTable = pgTable('payments', {
  id: serial('id').primaryKey(),
  invoice_id: integer('invoice_id').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  payment_method: paymentMethodEnum('payment_method').notNull(),
  payment_date: date('payment_date').notNull(),
  reference_number: text('reference_number'),
  notes: text('notes'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Communication campaigns table
export const campaignsTable = pgTable('campaigns', {
  id: serial('id').primaryKey(),
  company_id: integer('company_id').notNull(),
  name: text('name').notNull(),
  type: campaignTypeEnum('type').notNull(),
  subject: text('subject'),
  message: text('message').notNull(),
  status: campaignStatusEnum('status').default('draft').notNull(),
  scheduled_date: timestamp('scheduled_date'),
  sent_date: timestamp('sent_date'),
  recipient_count: integer('recipient_count').default(0).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Relations
export const companiesRelations = relations(companiesTable, ({ many }) => ({
  departments: many(departmentsTable),
  doctors: many(doctorsTable),
  patients: many(patientsTable),
  invoices: many(invoicesTable),
  campaigns: many(campaignsTable)
}));

export const departmentsRelations = relations(departmentsTable, ({ one, many }) => ({
  company: one(companiesTable, {
    fields: [departmentsTable.company_id],
    references: [companiesTable.id]
  }),
  doctors: many(doctorsTable)
}));

export const doctorsRelations = relations(doctorsTable, ({ one, many }) => ({
  company: one(companiesTable, {
    fields: [doctorsTable.company_id],
    references: [companiesTable.id]
  }),
  department: one(departmentsTable, {
    fields: [doctorsTable.department_id],
    references: [departmentsTable.id]
  }),
  schedules: many(doctorSchedulesTable),
  appointments: many(appointmentsTable),
  caseStudies: many(caseStudiesTable),
  prescriptions: many(prescriptionsTable),
  labReports: many(labReportsTable)
}));

export const patientsRelations = relations(patientsTable, ({ one, many }) => ({
  company: one(companiesTable, {
    fields: [patientsTable.company_id],
    references: [companiesTable.id]
  }),
  appointments: many(appointmentsTable),
  caseStudies: many(caseStudiesTable),
  prescriptions: many(prescriptionsTable),
  labReports: many(labReportsTable),
  invoices: many(invoicesTable)
}));

// Export all tables for proper query building
export const tables = {
  companies: companiesTable,
  departments: departmentsTable,
  doctors: doctorsTable,
  patients: patientsTable,
  doctorSchedules: doctorSchedulesTable,
  appointments: appointmentsTable,
  caseStudies: caseStudiesTable,
  prescriptions: prescriptionsTable,
  labReports: labReportsTable,
  invoices: invoicesTable,
  payments: paymentsTable,
  campaigns: campaignsTable
};
