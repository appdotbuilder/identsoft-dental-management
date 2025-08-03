
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, departmentsTable, doctorsTable, doctorSchedulesTable } from '../db/schema';
import { getDoctorSchedules } from '../handlers/get_doctor_schedules';

describe('getDoctorSchedules', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return doctor schedules for a specific doctor', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Test St',
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
        first_name: 'John',
        last_name: 'Smith',
        email: 'john.smith@clinic.com',
        phone: '555-0456',
        specialization: 'Cardiologist',
        license_number: 'DOC123'
      })
      .returning()
      .execute();

    // Create schedule entries
    const schedules = await db.insert(doctorSchedulesTable)
      .values([
        {
          doctor_id: doctor[0].id,
          day_of_week: 1, // Monday
          start_time: '09:00',
          end_time: '17:00'
        },
        {
          doctor_id: doctor[0].id,
          day_of_week: 2, // Tuesday
          start_time: '10:00',
          end_time: '18:00'
        }
      ])
      .returning()
      .execute();

    const result = await getDoctorSchedules(doctor[0].id);

    expect(result).toHaveLength(2);
    expect(result[0].doctor_id).toEqual(doctor[0].id);
    expect(result[0].day_of_week).toEqual(1);
    expect(result[0].start_time).toEqual('09:00:00');
    expect(result[0].end_time).toEqual('17:00:00');
    expect(result[0].is_available).toBe(true);
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].doctor_id).toEqual(doctor[0].id);
    expect(result[1].day_of_week).toEqual(2);
    expect(result[1].start_time).toEqual('10:00:00');
    expect(result[1].end_time).toEqual('18:00:00');
  });

  it('should return empty array for doctor with no schedules', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Test St',
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

    const doctor = await db.insert(doctorsTable)
      .values({
        company_id: company[0].id,
        department_id: department[0].id,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane.doe@clinic.com',
        phone: '555-0789',
        specialization: 'Cardiologist',
        license_number: 'DOC456'
      })
      .returning()
      .execute();

    const result = await getDoctorSchedules(doctor[0].id);

    expect(result).toHaveLength(0);
  });

  it('should return empty array for non-existent doctor', async () => {
    const result = await getDoctorSchedules(9999);

    expect(result).toHaveLength(0);
  });

  it('should only return schedules for the specified doctor', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Test St',
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

    // Create two doctors
    const doctors = await db.insert(doctorsTable)
      .values([
        {
          company_id: company[0].id,
          department_id: department[0].id,
          first_name: 'Doctor',
          last_name: 'One',
          email: 'doctor1@clinic.com',
          phone: '555-0001',
          specialization: 'Cardiologist',
          license_number: 'DOC001'
        },
        {
          company_id: company[0].id,
          department_id: department[0].id,
          first_name: 'Doctor',
          last_name: 'Two',
          email: 'doctor2@clinic.com',
          phone: '555-0002',
          specialization: 'Cardiologist',
          license_number: 'DOC002'
        }
      ])
      .returning()
      .execute();

    // Create schedules for both doctors
    await db.insert(doctorSchedulesTable)
      .values([
        {
          doctor_id: doctors[0].id,
          day_of_week: 1,
          start_time: '09:00',
          end_time: '17:00'
        },
        {
          doctor_id: doctors[1].id,
          day_of_week: 1,
          start_time: '10:00',
          end_time: '18:00'
        }
      ])
      .execute();

    const result = await getDoctorSchedules(doctors[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].doctor_id).toEqual(doctors[0].id);
    expect(result[0].start_time).toEqual('09:00:00');
  });
});
