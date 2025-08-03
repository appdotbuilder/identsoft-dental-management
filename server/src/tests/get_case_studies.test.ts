
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, departmentsTable, doctorsTable, patientsTable, caseStudiesTable } from '../db/schema';
import { getCaseStudies } from '../handlers/get_case_studies';

describe('getCaseStudies', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all case studies when no filters provided', async () => {
    // Create prerequisite data
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St',
        phone: '555-0123',
        email: 'clinic@test.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    const [department] = await db.insert(departmentsTable)
      .values({
        company_id: company.id,
        name: 'Cardiology',
        description: 'Heart specialists'
      })
      .returning()
      .execute();

    const [doctor] = await db.insert(doctorsTable)
      .values({
        company_id: company.id,
        department_id: department.id,
        first_name: 'Dr. John',
        last_name: 'Smith',
        email: 'doctor@test.com',
        phone: '555-0124',
        specialization: 'Cardiologist',
        license_number: 'DOC123'
      })
      .returning()
      .execute();

    const [patient] = await db.insert(patientsTable)
      .values({
        company_id: company.id,
        first_name: 'Jane',
        last_name: 'Doe',
        phone: '555-0125',
        date_of_birth: '1990-01-01',
        address: '456 Oak St'
      })
      .returning()
      .execute();

    // Create test case studies
    await db.insert(caseStudiesTable)
      .values([
        {
          patient_id: patient.id,
          doctor_id: doctor.id,
          title: 'Heart Condition Study',
          diagnosis: 'Cardiac arrhythmia',
          treatment_plan: 'Monitor heart rhythm',
          notes: 'Patient shows irregular heartbeat'
        },
        {
          patient_id: patient.id,
          doctor_id: doctor.id,
          title: 'Follow-up Study',
          diagnosis: 'Improved condition',
          treatment_plan: 'Continue monitoring',
          notes: 'Patient responding well'
        }
      ])
      .execute();

    const results = await getCaseStudies();

    expect(results).toHaveLength(2);
    expect(results[0].title).toEqual('Heart Condition Study');
    expect(results[0].diagnosis).toEqual('Cardiac arrhythmia');
    expect(results[0].patient_id).toEqual(patient.id);
    expect(results[0].doctor_id).toEqual(doctor.id);
    expect(results[0].status).toEqual('active');
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].updated_at).toBeInstanceOf(Date);
  });

  it('should filter case studies by patient ID', async () => {
    // Create prerequisite data
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St',
        phone: '555-0123',
        email: 'clinic@test.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    const [department] = await db.insert(departmentsTable)
      .values({
        company_id: company.id,
        name: 'Cardiology',
        description: 'Heart specialists'
      })
      .returning()
      .execute();

    const [doctor] = await db.insert(doctorsTable)
      .values({
        company_id: company.id,
        department_id: department.id,
        first_name: 'Dr. John',
        last_name: 'Smith',
        email: 'doctor@test.com',
        phone: '555-0124',
        specialization: 'Cardiologist',
        license_number: 'DOC123'
      })
      .returning()
      .execute();

    const [patient1] = await db.insert(patientsTable)
      .values({
        company_id: company.id,
        first_name: 'Jane',
        last_name: 'Doe',
        phone: '555-0125',
        date_of_birth: '1990-01-01',
        address: '456 Oak St'
      })
      .returning()
      .execute();

    const [patient2] = await db.insert(patientsTable)
      .values({
        company_id: company.id,
        first_name: 'John',
        last_name: 'Smith',
        phone: '555-0126',
        date_of_birth: '1985-05-15',
        address: '789 Pine St'
      })
      .returning()
      .execute();

    // Create case studies for both patients
    await db.insert(caseStudiesTable)
      .values([
        {
          patient_id: patient1.id,
          doctor_id: doctor.id,
          title: 'Patient 1 Study',
          diagnosis: 'Condition A',
          treatment_plan: 'Treatment A'
        },
        {
          patient_id: patient2.id,
          doctor_id: doctor.id,
          title: 'Patient 2 Study',
          diagnosis: 'Condition B',
          treatment_plan: 'Treatment B'
        }
      ])
      .execute();

    const results = await getCaseStudies(patient1.id);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Patient 1 Study');
    expect(results[0].patient_id).toEqual(patient1.id);
  });

  it('should filter case studies by doctor ID', async () => {
    // Create prerequisite data
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St',
        phone: '555-0123',
        email: 'clinic@test.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    const [department] = await db.insert(departmentsTable)
      .values({
        company_id: company.id,
        name: 'Cardiology',
        description: 'Heart specialists'
      })
      .returning()
      .execute();

    const [doctor1] = await db.insert(doctorsTable)
      .values({
        company_id: company.id,
        department_id: department.id,
        first_name: 'Dr. John',
        last_name: 'Smith',
        email: 'doctor1@test.com',
        phone: '555-0124',
        specialization: 'Cardiologist',
        license_number: 'DOC123'
      })
      .returning()
      .execute();

    const [doctor2] = await db.insert(doctorsTable)
      .values({
        company_id: company.id,
        department_id: department.id,
        first_name: 'Dr. Jane',
        last_name: 'Wilson',
        email: 'doctor2@test.com',
        phone: '555-0127',
        specialization: 'Cardiologist',
        license_number: 'DOC124'
      })
      .returning()
      .execute();

    const [patient] = await db.insert(patientsTable)
      .values({
        company_id: company.id,
        first_name: 'Jane',
        last_name: 'Doe',
        phone: '555-0125',
        date_of_birth: '1990-01-01',
        address: '456 Oak St'
      })
      .returning()
      .execute();

    // Create case studies for both doctors
    await db.insert(caseStudiesTable)
      .values([
        {
          patient_id: patient.id,
          doctor_id: doctor1.id,
          title: 'Doctor 1 Study',
          diagnosis: 'Condition A',
          treatment_plan: 'Treatment A'
        },
        {
          patient_id: patient.id,
          doctor_id: doctor2.id,
          title: 'Doctor 2 Study',
          diagnosis: 'Condition B',
          treatment_plan: 'Treatment B'
        }
      ])
      .execute();

    const results = await getCaseStudies(undefined, doctor1.id);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Doctor 1 Study');
    expect(results[0].doctor_id).toEqual(doctor1.id);
  });

  it('should filter by both patient and doctor ID', async () => {
    // Create prerequisite data
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St',
        phone: '555-0123',
        email: 'clinic@test.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    const [department] = await db.insert(departmentsTable)
      .values({
        company_id: company.id,
        name: 'Cardiology',
        description: 'Heart specialists'
      })
      .returning()
      .execute();

    const [doctor1] = await db.insert(doctorsTable)
      .values({
        company_id: company.id,
        department_id: department.id,
        first_name: 'Dr. John',
        last_name: 'Smith',
        email: 'doctor1@test.com',
        phone: '555-0124',
        specialization: 'Cardiologist',
        license_number: 'DOC123'
      })
      .returning()
      .execute();

    const [doctor2] = await db.insert(doctorsTable)
      .values({
        company_id: company.id,
        department_id: department.id,
        first_name: 'Dr. Jane',
        last_name: 'Wilson',
        email: 'doctor2@test.com',
        phone: '555-0127',
        specialization: 'Cardiologist',
        license_number: 'DOC124'
      })
      .returning()
      .execute();

    const [patient1] = await db.insert(patientsTable)
      .values({
        company_id: company.id,
        first_name: 'Jane',
        last_name: 'Doe',
        phone: '555-0125',
        date_of_birth: '1990-01-01',
        address: '456 Oak St'
      })
      .returning()
      .execute();

    const [patient2] = await db.insert(patientsTable)
      .values({
        company_id: company.id,
        first_name: 'John',
        last_name: 'Smith',
        phone: '555-0126',
        date_of_birth: '1985-05-15',
        address: '789 Pine St'
      })
      .returning()
      .execute();

    // Create case studies with different combinations
    await db.insert(caseStudiesTable)
      .values([
        {
          patient_id: patient1.id,
          doctor_id: doctor1.id,
          title: 'Target Study',
          diagnosis: 'Target condition',
          treatment_plan: 'Target treatment'
        },
        {
          patient_id: patient1.id,
          doctor_id: doctor2.id,
          title: 'Wrong Doctor Study',
          diagnosis: 'Other condition',
          treatment_plan: 'Other treatment'
        },
        {
          patient_id: patient2.id,
          doctor_id: doctor1.id,
          title: 'Wrong Patient Study',
          diagnosis: 'Different condition',
          treatment_plan: 'Different treatment'
        }
      ])
      .execute();

    const results = await getCaseStudies(patient1.id, doctor1.id);

    expect(results).toHaveLength(1);
    expect(results[0].title).toEqual('Target Study');
    expect(results[0].patient_id).toEqual(patient1.id);
    expect(results[0].doctor_id).toEqual(doctor1.id);
  });

  it('should return empty array when no matching case studies found', async () => {
    const results = await getCaseStudies(999, 999);
    expect(results).toHaveLength(0);
  });
});
