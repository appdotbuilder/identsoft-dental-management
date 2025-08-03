
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, departmentsTable, doctorsTable, patientsTable, appointmentsTable } from '../db/schema';
import { getAppointments } from '../handlers/get_appointments';

describe('getAppointments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all appointments when no filters provided', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St',
        phone: '555-0123',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    const department = await db.insert(departmentsTable)
      .values({
        company_id: company[0].id,
        name: 'Cardiology',
        description: 'Heart specialists'
      })
      .returning()
      .execute();

    const doctor = await db.insert(doctorsTable)
      .values({
        company_id: company[0].id,
        department_id: department[0].id,
        first_name: 'Dr. John',
        last_name: 'Smith',
        email: 'john.smith@clinic.com',
        phone: '555-0124',
        specialization: 'Cardiology',
        license_number: 'DOC123'
      })
      .returning()
      .execute();

    const patient = await db.insert(patientsTable)
      .values({
        company_id: company[0].id,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane.doe@email.com',
        phone: '555-0125',
        date_of_birth: '1990-01-01', // Convert Date to string
        address: '456 Oak Ave'
      })
      .returning()
      .execute();

    // Create test appointments
    await db.insert(appointmentsTable)
      .values([
        {
          patient_id: patient[0].id,
          doctor_id: doctor[0].id,
          appointment_date: '2024-01-15', // Convert Date to string
          appointment_time: '09:00',
          notes: 'Regular checkup'
        },
        {
          patient_id: patient[0].id,
          doctor_id: doctor[0].id,
          appointment_date: '2024-01-16', // Convert Date to string
          appointment_time: '10:30',
          notes: 'Follow up'
        }
      ])
      .execute();

    const result = await getAppointments();

    expect(result).toHaveLength(2);
    expect(result[0].patient_id).toEqual(patient[0].id);
    expect(result[0].doctor_id).toEqual(doctor[0].id);
    expect(result[0].appointment_date).toBeInstanceOf(Date);
    expect(result[0].appointment_time).toEqual('09:00:00'); // PostgreSQL returns with seconds
    expect(result[0].status).toEqual('scheduled');
    expect(result[0].notes).toEqual('Regular checkup');
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should filter appointments by doctor_id', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St',
        phone: '555-0123',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    const department = await db.insert(departmentsTable)
      .values({
        company_id: company[0].id,
        name: 'Cardiology'
      })
      .returning()
      .execute();

    const doctors = await db.insert(doctorsTable)
      .values([
        {
          company_id: company[0].id,
          department_id: department[0].id,
          first_name: 'Dr. John',
          last_name: 'Smith',
          email: 'john.smith@clinic.com',
          phone: '555-0124',
          specialization: 'Cardiology',
          license_number: 'DOC123'
        },
        {
          company_id: company[0].id,
          department_id: department[0].id,
          first_name: 'Dr. Jane',
          last_name: 'Wilson',
          email: 'jane.wilson@clinic.com',
          phone: '555-0126',
          specialization: 'Neurology',
          license_number: 'DOC124'
        }
      ])
      .returning()
      .execute();

    const patient = await db.insert(patientsTable)
      .values({
        company_id: company[0].id,
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-0125',
        date_of_birth: '1985-05-15', // Convert Date to string
        address: '456 Oak Ave'
      })
      .returning()
      .execute();

    // Create appointments for different doctors
    await db.insert(appointmentsTable)
      .values([
        {
          patient_id: patient[0].id,
          doctor_id: doctors[0].id,
          appointment_date: '2024-01-15', // Convert Date to string
          appointment_time: '09:00'
        },
        {
          patient_id: patient[0].id,
          doctor_id: doctors[1].id,
          appointment_date: '2024-01-16', // Convert Date to string
          appointment_time: '10:30'
        }
      ])
      .execute();

    const result = await getAppointments(doctors[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].doctor_id).toEqual(doctors[0].id);
    expect(result[0].patient_id).toEqual(patient[0].id);
  });

  it('should filter appointments by patient_id', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St',
        phone: '555-0123',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    const department = await db.insert(departmentsTable)
      .values({
        company_id: company[0].id,
        name: 'General'
      })
      .returning()
      .execute();

    const doctor = await db.insert(doctorsTable)
      .values({
        company_id: company[0].id,
        department_id: department[0].id,
        first_name: 'Dr. Smith',
        last_name: 'Johnson',
        email: 'smith.johnson@clinic.com',
        phone: '555-0124',
        specialization: 'General Practice',
        license_number: 'DOC123'
      })
      .returning()
      .execute();

    const patients = await db.insert(patientsTable)
      .values([
        {
          company_id: company[0].id,
          first_name: 'Alice',
          last_name: 'Brown',
          phone: '555-0125',
          date_of_birth: '1992-03-10', // Convert Date to string
          address: '789 Pine St'
        },
        {
          company_id: company[0].id,
          first_name: 'Bob',
          last_name: 'Green',
          phone: '555-0127',
          date_of_birth: '1988-07-22', // Convert Date to string
          address: '321 Elm St'
        }
      ])
      .returning()
      .execute();

    // Create appointments for different patients
    await db.insert(appointmentsTable)
      .values([
        {
          patient_id: patients[0].id,
          doctor_id: doctor[0].id,
          appointment_date: '2024-01-15', // Convert Date to string
          appointment_time: '14:00'
        },
        {
          patient_id: patients[1].id,
          doctor_id: doctor[0].id,
          appointment_date: '2024-01-16', // Convert Date to string
          appointment_time: '15:30'
        }
      ])
      .execute();

    const result = await getAppointments(undefined, patients[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].patient_id).toEqual(patients[0].id);
    expect(result[0].doctor_id).toEqual(doctor[0].id);
    expect(result[0].appointment_time).toEqual('14:00:00'); // PostgreSQL returns with seconds
  });

  it('should filter appointments by both doctor_id and patient_id', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St',
        phone: '555-0123',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    const department = await db.insert(departmentsTable)
      .values({
        company_id: company[0].id,
        name: 'General'
      })
      .returning()
      .execute();

    const doctors = await db.insert(doctorsTable)
      .values([
        {
          company_id: company[0].id,
          department_id: department[0].id,
          first_name: 'Dr. Alpha',
          last_name: 'One',
          email: 'alpha.one@clinic.com',
          phone: '555-0124',
          specialization: 'General Practice',
          license_number: 'DOC123'
        },
        {
          company_id: company[0].id,
          department_id: department[0].id,
          first_name: 'Dr. Beta',
          last_name: 'Two',
          email: 'beta.two@clinic.com',
          phone: '555-0128',
          specialization: 'Dermatology',
          license_number: 'DOC124'
        }
      ])
      .returning()
      .execute();

    const patients = await db.insert(patientsTable)
      .values([
        {
          company_id: company[0].id,
          first_name: 'Patient',
          last_name: 'One',
          phone: '555-0125',
          date_of_birth: '1990-01-01', // Convert Date to string
          address: '111 First St'
        },
        {
          company_id: company[0].id,
          first_name: 'Patient',
          last_name: 'Two',
          phone: '555-0127',
          date_of_birth: '1985-12-31', // Convert Date to string
          address: '222 Second St'
        }
      ])
      .returning()
      .execute();

    // Create multiple appointments with different combinations
    await db.insert(appointmentsTable)
      .values([
        {
          patient_id: patients[0].id,
          doctor_id: doctors[0].id,
          appointment_date: '2024-01-15', // Convert Date to string
          appointment_time: '09:00'
        },
        {
          patient_id: patients[0].id,
          doctor_id: doctors[1].id,
          appointment_date: '2024-01-16', // Convert Date to string
          appointment_time: '10:00'
        },
        {
          patient_id: patients[1].id,
          doctor_id: doctors[0].id,
          appointment_date: '2024-01-17', // Convert Date to string
          appointment_time: '11:00'
        }
      ])
      .execute();

    const result = await getAppointments(doctors[0].id, patients[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].doctor_id).toEqual(doctors[0].id);
    expect(result[0].patient_id).toEqual(patients[0].id);
    expect(result[0].appointment_time).toEqual('09:00:00'); // PostgreSQL returns with seconds
  });

  it('should return empty array when no appointments match filters', async () => {
    const result = await getAppointments(999, 999);

    expect(result).toHaveLength(0);
  });
});
