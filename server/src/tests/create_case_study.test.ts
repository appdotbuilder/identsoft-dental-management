
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { caseStudiesTable, companiesTable, departmentsTable, doctorsTable, patientsTable } from '../db/schema';
import { type CreateCaseStudyInput } from '../schema';
import { createCaseStudy } from '../handlers/create_case_study';
import { eq } from 'drizzle-orm';

describe('createCaseStudy', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a case study', async () => {
    // Create prerequisite company
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
    const companyId = companyResult[0].id;

    // Create prerequisite department
    const departmentResult = await db.insert(departmentsTable)
      .values({
        company_id: companyId,
        name: 'Cardiology',
        description: 'Heart care department'
      })
      .returning()
      .execute();
    const departmentId = departmentResult[0].id;

    // Create prerequisite doctor
    const doctorResult = await db.insert(doctorsTable)
      .values({
        company_id: companyId,
        department_id: departmentId,
        first_name: 'Dr. John',
        last_name: 'Smith',
        email: 'doctor@clinic.com',
        phone: '555-0124',
        specialization: 'Cardiology',
        license_number: 'DOC123'
      })
      .returning()
      .execute();
    const doctorId = doctorResult[0].id;

    // Create prerequisite patient
    const patientResult = await db.insert(patientsTable)
      .values({
        company_id: companyId,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'patient@email.com',
        phone: '555-0125',
        date_of_birth: '1990-01-01',
        address: '456 Oak St',
        insurance_number: 'INS123',
        emergency_contact: '555-0126'
      })
      .returning()
      .execute();
    const patientId = patientResult[0].id;

    const testInput: CreateCaseStudyInput = {
      patient_id: patientId,
      doctor_id: doctorId,
      title: 'Chest Pain Investigation',
      diagnosis: 'Acute coronary syndrome',
      treatment_plan: 'Medication therapy and lifestyle changes',
      notes: 'Patient reports chest pain for 2 days'
    };

    const result = await createCaseStudy(testInput);

    // Basic field validation
    expect(result.patient_id).toEqual(patientId);
    expect(result.doctor_id).toEqual(doctorId);
    expect(result.title).toEqual('Chest Pain Investigation');
    expect(result.diagnosis).toEqual('Acute coronary syndrome');
    expect(result.treatment_plan).toEqual('Medication therapy and lifestyle changes');
    expect(result.notes).toEqual('Patient reports chest pain for 2 days');
    expect(result.status).toEqual('active');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save case study to database', async () => {
    // Create prerequisite company
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
    const companyId = companyResult[0].id;

    // Create prerequisite department
    const departmentResult = await db.insert(departmentsTable)
      .values({
        company_id: companyId,
        name: 'Orthopedics',
        description: 'Bone and joint care'
      })
      .returning()
      .execute();
    const departmentId = departmentResult[0].id;

    // Create prerequisite doctor
    const doctorResult = await db.insert(doctorsTable)
      .values({
        company_id: companyId,
        department_id: departmentId,
        first_name: 'Dr. Sarah',
        last_name: 'Johnson',
        email: 'sarah@clinic.com',
        phone: '555-0127',
        specialization: 'Orthopedics',
        license_number: 'DOC456'
      })
      .returning()
      .execute();
    const doctorId = doctorResult[0].id;

    // Create prerequisite patient
    const patientResult = await db.insert(patientsTable)
      .values({
        company_id: companyId,
        first_name: 'Bob',
        last_name: 'Wilson',
        phone: '555-0128',
        date_of_birth: '1985-05-15',
        address: '789 Pine St'
      })
      .returning()
      .execute();
    const patientId = patientResult[0].id;

    const testInput: CreateCaseStudyInput = {
      patient_id: patientId,
      doctor_id: doctorId,
      title: 'Knee Pain Assessment',
      diagnosis: 'Osteoarthritis',
      treatment_plan: 'Physical therapy and pain management'
    };

    const result = await createCaseStudy(testInput);

    // Query database to verify persistence
    const caseStudies = await db.select()
      .from(caseStudiesTable)
      .where(eq(caseStudiesTable.id, result.id))
      .execute();

    expect(caseStudies).toHaveLength(1);
    expect(caseStudies[0].patient_id).toEqual(patientId);
    expect(caseStudies[0].doctor_id).toEqual(doctorId);
    expect(caseStudies[0].title).toEqual('Knee Pain Assessment');
    expect(caseStudies[0].diagnosis).toEqual('Osteoarthritis');
    expect(caseStudies[0].treatment_plan).toEqual('Physical therapy and pain management');
    expect(caseStudies[0].notes).toBeNull();
    expect(caseStudies[0].status).toEqual('active');
    expect(caseStudies[0].created_at).toBeInstanceOf(Date);
    expect(caseStudies[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle case study with null notes', async () => {
    // Create prerequisite company
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
    const companyId = companyResult[0].id;

    // Create prerequisite department
    const departmentResult = await db.insert(departmentsTable)
      .values({
        company_id: companyId,
        name: 'General Medicine'
      })
      .returning()
      .execute();
    const departmentId = departmentResult[0].id;

    // Create prerequisite doctor
    const doctorResult = await db.insert(doctorsTable)
      .values({
        company_id: companyId,
        department_id: departmentId,
        first_name: 'Dr. Mike',
        last_name: 'Brown',
        email: 'mike@clinic.com',
        phone: '555-0129',
        specialization: 'General Medicine',
        license_number: 'DOC789'
      })
      .returning()
      .execute();
    const doctorId = doctorResult[0].id;

    // Create prerequisite patient
    const patientResult = await db.insert(patientsTable)
      .values({
        company_id: companyId,
        first_name: 'Alice',
        last_name: 'Green',
        phone: '555-0130',
        date_of_birth: '1975-12-20',
        address: '321 Elm St'
      })
      .returning()
      .execute();
    const patientId = patientResult[0].id;

    const testInput: CreateCaseStudyInput = {
      patient_id: patientId,
      doctor_id: doctorId,
      title: 'Annual Checkup',
      diagnosis: 'Healthy',
      treatment_plan: 'Continue current lifestyle'
    };

    const result = await createCaseStudy(testInput);

    expect(result.notes).toBeNull();
    expect(result.title).toEqual('Annual Checkup');
    expect(result.diagnosis).toEqual('Healthy');
    expect(result.treatment_plan).toEqual('Continue current lifestyle');
  });
});
