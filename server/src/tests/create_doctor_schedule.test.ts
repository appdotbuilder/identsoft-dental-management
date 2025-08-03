
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { doctorSchedulesTable, companiesTable, departmentsTable, doctorsTable } from '../db/schema';
import { type CreateDoctorScheduleInput } from '../schema';
import { createDoctorSchedule } from '../handlers/create_doctor_schedule';
import { eq } from 'drizzle-orm';

describe('createDoctorSchedule', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let doctorId: number;

  beforeEach(async () => {
    // Create prerequisite data: company -> department -> doctor
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Test St',
        phone: '123-456-7890',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    const departmentResult = await db.insert(departmentsTable)
      .values({
        company_id: companyResult[0].id,
        name: 'Cardiology',
        description: 'Heart department'
      })
      .returning()
      .execute();

    const doctorResult = await db.insert(doctorsTable)
      .values({
        company_id: companyResult[0].id,
        department_id: departmentResult[0].id,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@clinic.com',
        phone: '123-456-7890',
        specialization: 'Cardiology',
        license_number: 'DOC123'
      })
      .returning()
      .execute();

    doctorId = doctorResult[0].id;
  });

  const testInput: CreateDoctorScheduleInput = {
    doctor_id: 0, // Will be set in tests
    day_of_week: 1, // Monday
    start_time: '09:00',
    end_time: '17:00'
  };

  it('should create a doctor schedule', async () => {
    const input = { ...testInput, doctor_id: doctorId };
    const result = await createDoctorSchedule(input);

    // Basic field validation
    expect(result.doctor_id).toEqual(doctorId);
    expect(result.day_of_week).toEqual(1);
    expect(result.start_time).toEqual('09:00');
    expect(result.end_time).toEqual('17:00');
    expect(result.is_available).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save doctor schedule to database', async () => {
    const input = { ...testInput, doctor_id: doctorId };
    const result = await createDoctorSchedule(input);

    // Query using proper drizzle syntax
    const schedules = await db.select()
      .from(doctorSchedulesTable)
      .where(eq(doctorSchedulesTable.id, result.id))
      .execute();

    expect(schedules).toHaveLength(1);
    expect(schedules[0].doctor_id).toEqual(doctorId);
    expect(schedules[0].day_of_week).toEqual(1);
    // Database stores time as HH:MM:SS, so we expect the full format
    expect(schedules[0].start_time).toEqual('09:00:00');
    expect(schedules[0].end_time).toEqual('17:00:00');
    expect(schedules[0].is_available).toEqual(true);
    expect(schedules[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle weekend schedules', async () => {
    const weekendInput = {
      ...testInput,
      doctor_id: doctorId,
      day_of_week: 0, // Sunday
      start_time: '10:00',
      end_time: '14:00'
    };

    const result = await createDoctorSchedule(weekendInput);

    expect(result.day_of_week).toEqual(0);
    expect(result.start_time).toEqual('10:00');
    expect(result.end_time).toEqual('14:00');
    expect(result.is_available).toEqual(true);
  });

  it('should handle different time formats', async () => {
    const timeInput = {
      ...testInput,
      doctor_id: doctorId,
      start_time: '08:30',
      end_time: '16:45'
    };

    const result = await createDoctorSchedule(timeInput);

    expect(result.start_time).toEqual('08:30');
    expect(result.end_time).toEqual('16:45');
  });

  it('should throw error for non-existent doctor', async () => {
    const invalidInput = {
      ...testInput,
      doctor_id: 99999 // Non-existent doctor
    };

    await expect(createDoctorSchedule(invalidInput)).rejects.toThrow(/doctor with id.*does not exist/i);
  });
});
