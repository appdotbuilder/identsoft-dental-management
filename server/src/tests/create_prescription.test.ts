
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { prescriptionsTable, companiesTable, departmentsTable, doctorsTable, patientsTable, caseStudiesTable } from '../db/schema';
import { type CreatePrescriptionInput } from '../schema';
import { createPrescription } from '../handlers/create_prescription';
import { eq } from 'drizzle-orm';

describe('createPrescription', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a prescription', async () => {
    // Create prerequisite data
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St',
        phone: '555-0123',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    const departmentResult = await db.insert(departmentsTable)
      .values({
        company_id: companyResult[0].id,
        name: 'Cardiology',
        description: 'Heart specialists'
      })
      .returning()
      .execute();

    const doctorResult = await db.insert(doctorsTable)
      .values({
        company_id: companyResult[0].id,
        department_id: departmentResult[0].id,
        first_name: 'Dr. John',
        last_name: 'Smith',
        email: 'dr.smith@clinic.com',
        phone: '555-0124',
        specialization: 'Cardiology',
        license_number: 'DOC123'
      })
      .returning()
      .execute();

    const patientResult = await db.insert(patientsTable)
      .values({
        company_id: companyResult[0].id,
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice@example.com',
        phone: '555-0125',
        date_of_birth: '1990-01-01',
        address: '456 Oak St',
        insurance_number: 'INS123',
        emergency_contact: '555-0126'
      })
      .returning()
      .execute();

    const testInput: CreatePrescriptionInput = {
      patient_id: patientResult[0].id,
      doctor_id: doctorResult[0].id,
      case_study_id: null,
      medication_name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      duration: '30 days',
      instructions: 'Take with food'
    };

    const result = await createPrescription(testInput);

    // Basic field validation
    expect(result.patient_id).toEqual(patientResult[0].id);
    expect(result.doctor_id).toEqual(doctorResult[0].id);
    expect(result.case_study_id).toBeNull();
    expect(result.medication_name).toEqual('Lisinopril');
    expect(result.dosage).toEqual('10mg');
    expect(result.frequency).toEqual('Once daily');
    expect(result.duration).toEqual('30 days');
    expect(result.instructions).toEqual('Take with food');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save prescription to database', async () => {
    // Create prerequisite data
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St',
        phone: '555-0123',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    const departmentResult = await db.insert(departmentsTable)
      .values({
        company_id: companyResult[0].id,
        name: 'Cardiology',
        description: 'Heart specialists'
      })
      .returning()
      .execute();

    const doctorResult = await db.insert(doctorsTable)
      .values({
        company_id: companyResult[0].id,
        department_id: departmentResult[0].id,
        first_name: 'Dr. John',
        last_name: 'Smith',
        email: 'dr.smith@clinic.com',
        phone: '555-0124',
        specialization: 'Cardiology',
        license_number: 'DOC123'
      })
      .returning()
      .execute();

    const patientResult = await db.insert(patientsTable)
      .values({
        company_id: companyResult[0].id,
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice@example.com',
        phone: '555-0125',
        date_of_birth: '1990-01-01',
        address: '456 Oak St',
        insurance_number: 'INS123',
        emergency_contact: '555-0126'
      })
      .returning()
      .execute();

    const testInput: CreatePrescriptionInput = {
      patient_id: patientResult[0].id,
      doctor_id: doctorResult[0].id,
      case_study_id: null,
      medication_name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      duration: '30 days',
      instructions: 'Take with food'
    };

    const result = await createPrescription(testInput);

    // Query using proper drizzle syntax
    const prescriptions = await db.select()
      .from(prescriptionsTable)
      .where(eq(prescriptionsTable.id, result.id))
      .execute();

    expect(prescriptions).toHaveLength(1);
    expect(prescriptions[0].patient_id).toEqual(patientResult[0].id);
    expect(prescriptions[0].doctor_id).toEqual(doctorResult[0].id);
    expect(prescriptions[0].case_study_id).toBeNull();
    expect(prescriptions[0].medication_name).toEqual('Lisinopril');
    expect(prescriptions[0].dosage).toEqual('10mg');
    expect(prescriptions[0].frequency).toEqual('Once daily');
    expect(prescriptions[0].duration).toEqual('30 days');
    expect(prescriptions[0].instructions).toEqual('Take with food');
    expect(prescriptions[0].created_at).toBeInstanceOf(Date);
  });

  it('should create prescription with case study reference', async () => {
    // Create prerequisite data
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St',
        phone: '555-0123',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    const departmentResult = await db.insert(departmentsTable)
      .values({
        company_id: companyResult[0].id,
        name: 'Cardiology',
        description: 'Heart specialists'
      })
      .returning()
      .execute();

    const doctorResult = await db.insert(doctorsTable)
      .values({
        company_id: companyResult[0].id,
        department_id: departmentResult[0].id,
        first_name: 'Dr. John',
        last_name: 'Smith',
        email: 'dr.smith@clinic.com',
        phone: '555-0124',
        specialization: 'Cardiology',
        license_number: 'DOC123'
      })
      .returning()
      .execute();

    const patientResult = await db.insert(patientsTable)
      .values({
        company_id: companyResult[0].id,
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice@example.com',
        phone: '555-0125',
        date_of_birth: '1990-01-01',
        address: '456 Oak St',
        insurance_number: 'INS123',
        emergency_contact: '555-0126'
      })
      .returning()
      .execute();

    const caseStudyResult = await db.insert(caseStudiesTable)
      .values({
        patient_id: patientResult[0].id,
        doctor_id: doctorResult[0].id,
        title: 'Hypertension Treatment',
        diagnosis: 'High blood pressure',
        treatment_plan: 'Medication and lifestyle changes',
        notes: 'Patient responding well'
      })
      .returning()
      .execute();

    const testInput: CreatePrescriptionInput = {
      patient_id: patientResult[0].id,
      doctor_id: doctorResult[0].id,
      case_study_id: caseStudyResult[0].id,
      medication_name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      duration: '30 days',
      instructions: 'Take with food'
    };

    const result = await createPrescription(testInput);

    expect(result.case_study_id).toEqual(caseStudyResult[0].id);
    expect(result.medication_name).toEqual('Lisinopril');
    expect(result.id).toBeDefined();
  });

  it('should create prescription with optional fields omitted', async () => {
    // Create prerequisite data
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St',
        phone: '555-0123',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    const departmentResult = await db.insert(departmentsTable)
      .values({
        company_id: companyResult[0].id,
        name: 'Cardiology',
        description: 'Heart specialists'
      })
      .returning()
      .execute();

    const doctorResult = await db.insert(doctorsTable)
      .values({
        company_id: companyResult[0].id,
        department_id: departmentResult[0].id,
        first_name: 'Dr. John',
        last_name: 'Smith',
        email: 'dr.smith@clinic.com',
        phone: '555-0124',
        specialization: 'Cardiology',
        license_number: 'DOC123'
      })
      .returning()
      .execute();

    const patientResult = await db.insert(patientsTable)
      .values({
        company_id: companyResult[0].id,
        first_name: 'Alice',
        last_name: 'Johnson',
        email: 'alice@example.com',
        phone: '555-0125',
        date_of_birth: '1990-01-01',
        address: '456 Oak St',
        insurance_number: 'INS123',
        emergency_contact: '555-0126'
      })
      .returning()
      .execute();

    const testInput: CreatePrescriptionInput = {
      patient_id: patientResult[0].id,
      doctor_id: doctorResult[0].id,
      medication_name: 'Aspirin',
      dosage: '81mg',
      frequency: 'Daily',
      duration: 'Indefinite'
    };

    const result = await createPrescription(testInput);

    expect(result.case_study_id).toBeNull();
    expect(result.instructions).toBeNull();
    expect(result.medication_name).toEqual('Aspirin');
    expect(result.dosage).toEqual('81mg');
    expect(result.frequency).toEqual('Daily');
    expect(result.duration).toEqual('Indefinite');
  });
});
