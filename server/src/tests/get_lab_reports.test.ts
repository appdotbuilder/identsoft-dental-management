
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, departmentsTable, doctorsTable, patientsTable, labReportsTable } from '../db/schema';
import { getLabReports } from '../handlers/get_lab_reports';

describe('getLabReports', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all lab reports when no filters provided', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable).values({
      name: 'Test Clinic',
      address: '123 Test St',
      phone: '555-0100',
      email: 'test@clinic.com',
      license_number: 'LIC001'
    }).returning().execute();

    const department = await db.insert(departmentsTable).values({
      company_id: company[0].id,
      name: 'Test Department',
      description: 'Test Description'
    }).returning().execute();

    const doctor = await db.insert(doctorsTable).values({
      company_id: company[0].id,
      department_id: department[0].id,
      first_name: 'Dr. John',
      last_name: 'Smith',
      email: 'doctor@clinic.com',
      phone: '555-0101',
      specialization: 'General Medicine',
      license_number: 'DOC001'
    }).returning().execute();

    const patient = await db.insert(patientsTable).values({
      company_id: company[0].id,
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane@example.com',
      phone: '555-0102',
      date_of_birth: '1990-01-01', // String format for date column
      address: '456 Patient St',
      insurance_number: 'INS001',
      emergency_contact: '555-0103'
    }).returning().execute();

    // Create test lab reports
    await db.insert(labReportsTable).values([
      {
        patient_id: patient[0].id,
        doctor_id: doctor[0].id,
        test_name: 'Blood Test',
        test_date: '2024-01-15', // String format for date column
        results: 'Normal',
        status: 'completed'
      },
      {
        patient_id: patient[0].id,
        doctor_id: doctor[0].id,
        test_name: 'X-Ray',
        test_date: '2024-01-16', // String format for date column
        results: 'Clear',
        status: 'reviewed'
      }
    ]).execute();

    const results = await getLabReports();

    expect(results).toHaveLength(2);
    expect(results[0].test_name).toEqual('Blood Test');
    expect(results[0].results).toEqual('Normal');
    expect(results[0].status).toEqual('completed');
    expect(results[0].test_date).toBeInstanceOf(Date);
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[1].test_name).toEqual('X-Ray');
    expect(results[1].results).toEqual('Clear');
    expect(results[1].status).toEqual('reviewed');
  });

  it('should filter lab reports by patient ID', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable).values({
      name: 'Test Clinic',
      address: '123 Test St',
      phone: '555-0100',
      email: 'test@clinic.com',
      license_number: 'LIC001'
    }).returning().execute();

    const department = await db.insert(departmentsTable).values({
      company_id: company[0].id,
      name: 'Test Department'
    }).returning().execute();

    const doctor = await db.insert(doctorsTable).values({
      company_id: company[0].id,
      department_id: department[0].id,
      first_name: 'Dr. John',
      last_name: 'Smith',
      email: 'doctor@clinic.com',
      phone: '555-0101',
      specialization: 'General Medicine',
      license_number: 'DOC001'
    }).returning().execute();

    const patients = await db.insert(patientsTable).values([
      {
        company_id: company[0].id,
        first_name: 'Jane',
        last_name: 'Doe',
        phone: '555-0102',
        date_of_birth: '1990-01-01', // String format for date column
        address: '456 Patient St'
      },
      {
        company_id: company[0].id,
        first_name: 'John',
        last_name: 'Patient',
        phone: '555-0103',
        date_of_birth: '1985-01-01', // String format for date column
        address: '789 Patient Ave'
      }
    ]).returning().execute();

    // Create lab reports for both patients
    await db.insert(labReportsTable).values([
      {
        patient_id: patients[0].id,
        doctor_id: doctor[0].id,
        test_name: 'Blood Test Patient 1',
        test_date: '2024-01-15', // String format for date column
        results: 'Normal'
      },
      {
        patient_id: patients[1].id,
        doctor_id: doctor[0].id,
        test_name: 'Blood Test Patient 2',
        test_date: '2024-01-16', // String format for date column
        results: 'Abnormal'
      }
    ]).execute();

    const results = await getLabReports(patients[0].id);

    expect(results).toHaveLength(1);
    expect(results[0].test_name).toEqual('Blood Test Patient 1');
    expect(results[0].patient_id).toEqual(patients[0].id);
    expect(results[0].results).toEqual('Normal');
  });

  it('should filter lab reports by doctor ID', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable).values({
      name: 'Test Clinic',
      address: '123 Test St',
      phone: '555-0100',
      email: 'test@clinic.com',
      license_number: 'LIC001'
    }).returning().execute();

    const department = await db.insert(departmentsTable).values({
      company_id: company[0].id,
      name: 'Test Department'
    }).returning().execute();

    const doctors = await db.insert(doctorsTable).values([
      {
        company_id: company[0].id,
        department_id: department[0].id,
        first_name: 'Dr. John',
        last_name: 'Smith',
        email: 'doctor1@clinic.com',
        phone: '555-0101',
        specialization: 'General Medicine',
        license_number: 'DOC001'
      },
      {
        company_id: company[0].id,
        department_id: department[0].id,
        first_name: 'Dr. Jane',
        last_name: 'Brown',
        email: 'doctor2@clinic.com',
        phone: '555-0102',
        specialization: 'Cardiology',
        license_number: 'DOC002'
      }
    ]).returning().execute();

    const patient = await db.insert(patientsTable).values({
      company_id: company[0].id,
      first_name: 'Test',
      last_name: 'Patient',
      phone: '555-0103',
      date_of_birth: '1990-01-01', // String format for date column
      address: '456 Patient St'
    }).returning().execute();

    // Create lab reports for both doctors
    await db.insert(labReportsTable).values([
      {
        patient_id: patient[0].id,
        doctor_id: doctors[0].id,
        test_name: 'Blood Test by Dr. Smith',
        test_date: '2024-01-15', // String format for date column
        results: 'Normal'
      },
      {
        patient_id: patient[0].id,
        doctor_id: doctors[1].id,
        test_name: 'ECG by Dr. Brown',
        test_date: '2024-01-16', // String format for date column
        results: 'Abnormal'
      }
    ]).execute();

    const results = await getLabReports(undefined, doctors[0].id);

    expect(results).toHaveLength(1);
    expect(results[0].test_name).toEqual('Blood Test by Dr. Smith');
    expect(results[0].doctor_id).toEqual(doctors[0].id);
    expect(results[0].results).toEqual('Normal');
  });

  it('should filter lab reports by both patient and doctor ID', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable).values({
      name: 'Test Clinic',
      address: '123 Test St',
      phone: '555-0100',
      email: 'test@clinic.com',
      license_number: 'LIC001'
    }).returning().execute();

    const department = await db.insert(departmentsTable).values({
      company_id: company[0].id,
      name: 'Test Department'
    }).returning().execute();

    const doctors = await db.insert(doctorsTable).values([
      {
        company_id: company[0].id,
        department_id: department[0].id,
        first_name: 'Dr. John',
        last_name: 'Smith',
        email: 'doctor1@clinic.com',
        phone: '555-0101',
        specialization: 'General Medicine',
        license_number: 'DOC001'
      },
      {
        company_id: company[0].id,
        department_id: department[0].id,
        first_name: 'Dr. Jane',
        last_name: 'Brown',
        email: 'doctor2@clinic.com',
        phone: '555-0102',
        specialization: 'Cardiology',
        license_number: 'DOC002'
      }
    ]).returning().execute();

    const patients = await db.insert(patientsTable).values([
      {
        company_id: company[0].id,
        first_name: 'Patient',
        last_name: 'One',
        phone: '555-0103',
        date_of_birth: '1990-01-01', // String format for date column
        address: '456 Patient St'
      },
      {
        company_id: company[0].id,
        first_name: 'Patient',
        last_name: 'Two',
        phone: '555-0104',
        date_of_birth: '1985-01-01', // String format for date column
        address: '789 Patient Ave'
      }
    ]).returning().execute();

    // Create multiple lab reports
    await db.insert(labReportsTable).values([
      {
        patient_id: patients[0].id,
        doctor_id: doctors[0].id,
        test_name: 'Target Report',
        test_date: '2024-01-15', // String format for date column
        results: 'Normal'
      },
      {
        patient_id: patients[0].id,
        doctor_id: doctors[1].id,
        test_name: 'Different Doctor Report',
        test_date: '2024-01-16', // String format for date column
        results: 'Abnormal'
      },
      {
        patient_id: patients[1].id,
        doctor_id: doctors[0].id,
        test_name: 'Different Patient Report',
        test_date: '2024-01-17', // String format for date column
        results: 'Pending'
      }
    ]).execute();

    const results = await getLabReports(patients[0].id, doctors[0].id);

    expect(results).toHaveLength(1);
    expect(results[0].test_name).toEqual('Target Report');
    expect(results[0].patient_id).toEqual(patients[0].id);
    expect(results[0].doctor_id).toEqual(doctors[0].id);
    expect(results[0].results).toEqual('Normal');
  });

  it('should return empty array when no lab reports match filters', async () => {
    const results = await getLabReports(999, 999);

    expect(results).toHaveLength(0);
  });
});
