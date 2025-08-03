
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { labReportsTable, companiesTable, departmentsTable, doctorsTable, patientsTable, caseStudiesTable } from '../db/schema';
import { type CreateLabReportInput } from '../schema';
import { createLabReport } from '../handlers/create_lab_report';
import { eq } from 'drizzle-orm';

describe('createLabReport', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let companyId: number;
  let departmentId: number;
  let doctorId: number;
  let patientId: number;
  let caseStudyId: number;

  beforeEach(async () => {
    // Create prerequisite data
    const companies = await db.insert(companiesTable)
      .values({
        name: 'Test Medical Center',
        address: '123 Medical St',
        phone: '555-0123',
        email: 'test@medical.com',
        license_number: 'LIC123456'
      })
      .returning()
      .execute();
    companyId = companies[0].id;

    const departments = await db.insert(departmentsTable)
      .values({
        company_id: companyId,
        name: 'Cardiology',
        description: 'Heart specialists'
      })
      .returning()
      .execute();
    departmentId = departments[0].id;

    const doctors = await db.insert(doctorsTable)
      .values({
        company_id: companyId,
        department_id: departmentId,
        first_name: 'Dr. John',
        last_name: 'Smith',
        email: 'dr.smith@medical.com',
        phone: '555-0100',
        specialization: 'Cardiology',
        license_number: 'DOC123456'
      })
      .returning()
      .execute();
    doctorId = doctors[0].id;

    const patients = await db.insert(patientsTable)
      .values({
        company_id: companyId,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane.doe@email.com',
        phone: '555-0200',
        date_of_birth: new Date('1990-01-01').toISOString().split('T')[0], // Convert Date to string
        address: '456 Patient Ave',
        insurance_number: 'INS789012',
        emergency_contact: 'John Doe - 555-0201'
      })
      .returning()
      .execute();
    patientId = patients[0].id;

    const caseStudies = await db.insert(caseStudiesTable)
      .values({
        patient_id: patientId,
        doctor_id: doctorId,
        title: 'Cardiac Evaluation',
        diagnosis: 'Chest pain evaluation',
        treatment_plan: 'Further testing required'
      })
      .returning()
      .execute();
    caseStudyId = caseStudies[0].id;
  });

  const testInput: CreateLabReportInput = {
    patient_id: 1, // Will be overridden in tests
    doctor_id: 1, // Will be overridden in tests
    case_study_id: 1, // Will be overridden in tests
    test_name: 'Blood Test',
    test_date: new Date('2024-01-15'),
    results: 'All values within normal range',
    notes: 'Patient fasted for 12 hours',
    file_path: '/reports/blood_test_123.pdf'
  };

  it('should create a lab report with all fields', async () => {
    const input = {
      ...testInput,
      patient_id: patientId,
      doctor_id: doctorId,
      case_study_id: caseStudyId
    };

    const result = await createLabReport(input);

    expect(result.patient_id).toEqual(patientId);
    expect(result.doctor_id).toEqual(doctorId);
    expect(result.case_study_id).toEqual(caseStudyId);
    expect(result.test_name).toEqual('Blood Test');
    expect(result.test_date).toEqual(new Date('2024-01-15'));
    expect(result.results).toEqual('All values within normal range');
    expect(result.notes).toEqual('Patient fasted for 12 hours');
    expect(result.file_path).toEqual('/reports/blood_test_123.pdf');
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a lab report without optional fields', async () => {
    const input = {
      patient_id: patientId,
      doctor_id: doctorId,
      test_name: 'X-Ray',
      test_date: new Date('2024-01-20'),
      results: 'No abnormalities detected'
    };

    const result = await createLabReport(input);

    expect(result.patient_id).toEqual(patientId);
    expect(result.doctor_id).toEqual(doctorId);
    expect(result.case_study_id).toBeNull();
    expect(result.test_name).toEqual('X-Ray');
    expect(result.test_date).toEqual(new Date('2024-01-20'));
    expect(result.results).toEqual('No abnormalities detected');
    expect(result.notes).toBeNull();
    expect(result.file_path).toBeNull();
    expect(result.status).toEqual('pending');
  });

  it('should save lab report to database', async () => {
    const input = {
      ...testInput,
      patient_id: patientId,
      doctor_id: doctorId,
      case_study_id: caseStudyId
    };

    const result = await createLabReport(input);

    const labReports = await db.select()
      .from(labReportsTable)
      .where(eq(labReportsTable.id, result.id))
      .execute();

    expect(labReports).toHaveLength(1);
    expect(labReports[0].patient_id).toEqual(patientId);
    expect(labReports[0].doctor_id).toEqual(doctorId);
    expect(labReports[0].case_study_id).toEqual(caseStudyId);
    expect(labReports[0].test_name).toEqual('Blood Test');
    expect(labReports[0].results).toEqual('All values within normal range');
    expect(labReports[0].status).toEqual('pending');
    expect(labReports[0].created_at).toBeInstanceOf(Date);
    expect(new Date(labReports[0].test_date)).toEqual(new Date('2024-01-15'));
  });

  it('should handle null case_study_id correctly', async () => {
    const input = {
      patient_id: patientId,
      doctor_id: doctorId,
      case_study_id: null,
      test_name: 'MRI Scan',
      test_date: new Date('2024-01-25'),
      results: 'Scan completed successfully'
    };

    const result = await createLabReport(input);

    expect(result.case_study_id).toBeNull();

    const labReports = await db.select()
      .from(labReportsTable)
      .where(eq(labReportsTable.id, result.id))
      .execute();

    expect(labReports[0].case_study_id).toBeNull();
  });

  it('should handle different test types correctly', async () => {
    const inputs = [
      {
        patient_id: patientId,
        doctor_id: doctorId,
        test_name: 'CBC',
        test_date: new Date('2024-01-10'),
        results: 'Complete Blood Count normal'
      },
      {
        patient_id: patientId,
        doctor_id: doctorId,
        test_name: 'Lipid Panel',
        test_date: new Date('2024-01-11'),
        results: 'Cholesterol levels elevated'
      }
    ];

    const results = await Promise.all(inputs.map(input => createLabReport(input)));

    expect(results).toHaveLength(2);
    expect(results[0].test_name).toEqual('CBC');
    expect(results[1].test_name).toEqual('Lipid Panel');
    expect(results[0].results).toEqual('Complete Blood Count normal');
    expect(results[1].results).toEqual('Cholesterol levels elevated');
  });

  it('should preserve date precision correctly', async () => {
    const testDate = new Date('2024-03-15');
    const input = {
      patient_id: patientId,
      doctor_id: doctorId,
      test_name: 'Date Test',
      test_date: testDate,
      results: 'Testing date handling'
    };

    const result = await createLabReport(input);

    expect(result.test_date.getFullYear()).toEqual(2024);
    expect(result.test_date.getMonth()).toEqual(2); // March is month 2 (0-indexed)
    expect(result.test_date.getDate()).toEqual(15);
  });
});
