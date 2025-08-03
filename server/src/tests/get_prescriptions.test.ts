
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, departmentsTable, doctorsTable, patientsTable, prescriptionsTable, caseStudiesTable } from '../db/schema';
import { getPrescriptions } from '../handlers/get_prescriptions';
import { eq } from 'drizzle-orm';

describe('getPrescriptions', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all prescriptions when no filters are provided', async () => {
    // Create prerequisite data
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St',
        phone: '555-0100',
        email: 'test@clinic.com',
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
        email: 'john@clinic.com',
        phone: '555-0101',
        specialization: 'Cardiology',
        license_number: 'DOC123'
      })
      .returning()
      .execute();

    const [patient] = await db.insert(patientsTable)
      .values({
        company_id: company.id,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        phone: '555-0102',
        date_of_birth: '1990-01-01',
        address: '456 Oak St'
      })
      .returning()
      .execute();

    // Create test prescriptions
    const prescription1 = await db.insert(prescriptionsTable)
      .values({
        patient_id: patient.id,
        doctor_id: doctor.id,
        medication_name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: '30 days',
        instructions: 'Take with food'
      })
      .returning()
      .execute();

    const prescription2 = await db.insert(prescriptionsTable)
      .values({
        patient_id: patient.id,
        doctor_id: doctor.id,
        medication_name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '90 days'
      })
      .returning()
      .execute();

    const results = await getPrescriptions();

    expect(results).toHaveLength(2);
    expect(results[0].medication_name).toEqual('Lisinopril');
    expect(results[0].dosage).toEqual('10mg');
    expect(results[0].frequency).toEqual('Once daily');
    expect(results[0].duration).toEqual('30 days');
    expect(results[0].instructions).toEqual('Take with food');
    expect(results[0].patient_id).toEqual(patient.id);
    expect(results[0].doctor_id).toEqual(doctor.id);
    expect(results[0].created_at).toBeInstanceOf(Date);

    expect(results[1].medication_name).toEqual('Metformin');
    expect(results[1].dosage).toEqual('500mg');
    expect(results[1].instructions).toBeNull();
  });

  it('should filter prescriptions by patient ID', async () => {
    // Create prerequisite data
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St',
        phone: '555-0100',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    const [department] = await db.insert(departmentsTable)
      .values({
        company_id: company.id,
        name: 'Cardiology'
      })
      .returning()
      .execute();

    const [doctor] = await db.insert(doctorsTable)
      .values({
        company_id: company.id,
        department_id: department.id,
        first_name: 'Dr. John',
        last_name: 'Smith',
        email: 'john@clinic.com',
        phone: '555-0101',
        specialization: 'Cardiology',
        license_number: 'DOC123'
      })
      .returning()
      .execute();

    const [patient1] = await db.insert(patientsTable)
      .values({
        company_id: company.id,
        first_name: 'Jane',
        last_name: 'Doe',
        phone: '555-0102',
        date_of_birth: '1990-01-01',
        address: '456 Oak St'
      })
      .returning()
      .execute();

    const [patient2] = await db.insert(patientsTable)
      .values({
        company_id: company.id,
        first_name: 'John',
        last_name: 'Brown',
        phone: '555-0103',
        date_of_birth: '1985-05-15',
        address: '789 Pine St'
      })
      .returning()
      .execute();

    // Create prescriptions for both patients
    await db.insert(prescriptionsTable)
      .values({
        patient_id: patient1.id,
        doctor_id: doctor.id,
        medication_name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: '30 days'
      })
      .execute();

    await db.insert(prescriptionsTable)
      .values({
        patient_id: patient2.id,
        doctor_id: doctor.id,
        medication_name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '90 days'
      })
      .execute();

    const results = await getPrescriptions(patient1.id);

    expect(results).toHaveLength(1);
    expect(results[0].medication_name).toEqual('Lisinopril');
    expect(results[0].patient_id).toEqual(patient1.id);
  });

  it('should filter prescriptions by doctor ID', async () => {
    // Create prerequisite data
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St',
        phone: '555-0100',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    const [department] = await db.insert(departmentsTable)
      .values({
        company_id: company.id,
        name: 'Cardiology'
      })
      .returning()
      .execute();

    const [doctor1] = await db.insert(doctorsTable)
      .values({
        company_id: company.id,
        department_id: department.id,
        first_name: 'Dr. John',
        last_name: 'Smith',
        email: 'john@clinic.com',
        phone: '555-0101',
        specialization: 'Cardiology',
        license_number: 'DOC123'
      })
      .returning()
      .execute();

    const [doctor2] = await db.insert(doctorsTable)
      .values({
        company_id: company.id,
        department_id: department.id,
        first_name: 'Dr. Sarah',
        last_name: 'Johnson',
        email: 'sarah@clinic.com',
        phone: '555-0104',
        specialization: 'Internal Medicine',
        license_number: 'DOC456'
      })
      .returning()
      .execute();

    const [patient] = await db.insert(patientsTable)
      .values({
        company_id: company.id,
        first_name: 'Jane',
        last_name: 'Doe',
        phone: '555-0102',
        date_of_birth: '1990-01-01',
        address: '456 Oak St'
      })
      .returning()
      .execute();

    // Create prescriptions from both doctors
    await db.insert(prescriptionsTable)
      .values({
        patient_id: patient.id,
        doctor_id: doctor1.id,
        medication_name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: '30 days'
      })
      .execute();

    await db.insert(prescriptionsTable)
      .values({
        patient_id: patient.id,
        doctor_id: doctor2.id,
        medication_name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '90 days'
      })
      .execute();

    const results = await getPrescriptions(undefined, doctor1.id);

    expect(results).toHaveLength(1);
    expect(results[0].medication_name).toEqual('Lisinopril');
    expect(results[0].doctor_id).toEqual(doctor1.id);
  });

  it('should filter prescriptions by both patient ID and doctor ID', async () => {
    // Create prerequisite data
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St',
        phone: '555-0100',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    const [department] = await db.insert(departmentsTable)
      .values({
        company_id: company.id,
        name: 'Cardiology'
      })
      .returning()
      .execute();

    const [doctor1] = await db.insert(doctorsTable)
      .values({
        company_id: company.id,
        department_id: department.id,
        first_name: 'Dr. John',
        last_name: 'Smith',
        email: 'john@clinic.com',
        phone: '555-0101',
        specialization: 'Cardiology',
        license_number: 'DOC123'
      })
      .returning()
      .execute();

    const [doctor2] = await db.insert(doctorsTable)
      .values({
        company_id: company.id,
        department_id: department.id,
        first_name: 'Dr. Sarah',
        last_name: 'Johnson',
        email: 'sarah@clinic.com',
        phone: '555-0104',
        specialization: 'Internal Medicine',
        license_number: 'DOC456'
      })
      .returning()
      .execute();

    const [patient1] = await db.insert(patientsTable)
      .values({
        company_id: company.id,
        first_name: 'Jane',
        last_name: 'Doe',
        phone: '555-0102',
        date_of_birth: '1990-01-01',
        address: '456 Oak St'
      })
      .returning()
      .execute();

    const [patient2] = await db.insert(patientsTable)
      .values({
        company_id: company.id,
        first_name: 'John',
        last_name: 'Brown',
        phone: '555-0103',
        date_of_birth: '1985-05-15',
        address: '789 Pine St'
      })
      .returning()
      .execute();

    // Create prescriptions for different patient-doctor combinations
    await db.insert(prescriptionsTable)
      .values({
        patient_id: patient1.id,
        doctor_id: doctor1.id,
        medication_name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: '30 days'
      })
      .execute();

    await db.insert(prescriptionsTable)
      .values({
        patient_id: patient1.id,
        doctor_id: doctor2.id,
        medication_name: 'Metformin',
        dosage: '500mg',
        frequency: 'Twice daily',
        duration: '90 days'
      })
      .execute();

    await db.insert(prescriptionsTable)
      .values({
        patient_id: patient2.id,
        doctor_id: doctor1.id,
        medication_name: 'Aspirin',
        dosage: '81mg',
        frequency: 'Once daily',
        duration: 'Ongoing'
      })
      .execute();

    const results = await getPrescriptions(patient1.id, doctor1.id);

    expect(results).toHaveLength(1);
    expect(results[0].medication_name).toEqual('Lisinopril');
    expect(results[0].patient_id).toEqual(patient1.id);
    expect(results[0].doctor_id).toEqual(doctor1.id);
  });

  it('should return empty array when no prescriptions match filters', async () => {
    const results = await getPrescriptions(999, 999);
    expect(results).toHaveLength(0);
  });

  it('should handle case study association correctly', async () => {
    // Create prerequisite data
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St',
        phone: '555-0100',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    const [department] = await db.insert(departmentsTable)
      .values({
        company_id: company.id,
        name: 'Cardiology'
      })
      .returning()
      .execute();

    const [doctor] = await db.insert(doctorsTable)
      .values({
        company_id: company.id,
        department_id: department.id,
        first_name: 'Dr. John',
        last_name: 'Smith',
        email: 'john@clinic.com',
        phone: '555-0101',
        specialization: 'Cardiology',
        license_number: 'DOC123'
      })
      .returning()
      .execute();

    const [patient] = await db.insert(patientsTable)
      .values({
        company_id: company.id,
        first_name: 'Jane',
        last_name: 'Doe',
        phone: '555-0102',
        date_of_birth: '1990-01-01',
        address: '456 Oak St'
      })
      .returning()
      .execute();

    const [caseStudy] = await db.insert(caseStudiesTable)
      .values({
        patient_id: patient.id,
        doctor_id: doctor.id,
        title: 'Hypertension Management',
        diagnosis: 'Essential Hypertension',
        treatment_plan: 'Lifestyle changes and medication'
      })
      .returning()
      .execute();

    // Create prescription with case study association
    await db.insert(prescriptionsTable)
      .values({
        patient_id: patient.id,
        doctor_id: doctor.id,
        case_study_id: caseStudy.id,
        medication_name: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        duration: '30 days'
      })
      .execute();

    const results = await getPrescriptions(patient.id);

    expect(results).toHaveLength(1);
    expect(results[0].case_study_id).toEqual(caseStudy.id);
    expect(results[0].medication_name).toEqual('Lisinopril');
  });
});
