
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { appointmentsTable, companiesTable, departmentsTable, doctorsTable, patientsTable } from '../db/schema';
import { type CreateAppointmentInput } from '../schema';
import { createAppointment } from '../handlers/create_appointment';
import { eq } from 'drizzle-orm';

describe('createAppointment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let companyId: number;
  let departmentId: number;
  let doctorId: number;
  let patientId: number;

  beforeEach(async () => {
    // Create prerequisite company
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
    
    companyId = company[0].id;

    // Create prerequisite department
    const department = await db.insert(departmentsTable)
      .values({
        company_id: companyId,
        name: 'Cardiology',
        description: 'Heart specialists'
      })
      .returning()
      .execute();
    
    departmentId = department[0].id;

    // Create prerequisite doctor
    const doctor = await db.insert(doctorsTable)
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
    
    doctorId = doctor[0].id;

    // Create prerequisite patient
    const patient = await db.insert(patientsTable)
      .values({
        company_id: companyId,
        first_name: 'Jane',
        last_name: 'Doe',
        email: 'jane@example.com',
        phone: '555-0125',
        date_of_birth: '1990-01-01', // Use string format for date column
        address: '456 Patient Ave',
        insurance_number: 'INS123',
        emergency_contact: '555-0126'
      })
      .returning()
      .execute();
    
    patientId = patient[0].id;
  });

  const testInput: CreateAppointmentInput = {
    patient_id: 0, // Will be set in beforeEach
    doctor_id: 0, // Will be set in beforeEach
    appointment_date: new Date('2024-01-15'),
    appointment_time: '14:30',
    notes: 'Routine checkup'
  };

  it('should create an appointment', async () => {
    const input = {
      ...testInput,
      patient_id: patientId,
      doctor_id: doctorId
    };

    const result = await createAppointment(input);

    // Basic field validation
    expect(result.patient_id).toEqual(patientId);
    expect(result.doctor_id).toEqual(doctorId);
    expect(result.appointment_date).toEqual(new Date('2024-01-15'));
    expect(result.appointment_time).toEqual('14:30');
    expect(result.status).toEqual('scheduled');
    expect(result.notes).toEqual('Routine checkup');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save appointment to database', async () => {
    const input = {
      ...testInput,
      patient_id: patientId,
      doctor_id: doctorId
    };

    const result = await createAppointment(input);

    // Query database to verify persistence
    const appointments = await db.select()
      .from(appointmentsTable)
      .where(eq(appointmentsTable.id, result.id))
      .execute();

    expect(appointments).toHaveLength(1);
    expect(appointments[0].patient_id).toEqual(patientId);
    expect(appointments[0].doctor_id).toEqual(doctorId);
    expect(new Date(appointments[0].appointment_date)).toEqual(new Date('2024-01-15')); // Convert string to Date for comparison
    expect(appointments[0].appointment_time.substring(0, 5)).toEqual('14:30'); // Compare only HH:MM part
    expect(appointments[0].status).toEqual('scheduled');
    expect(appointments[0].notes).toEqual('Routine checkup');
    expect(appointments[0].created_at).toBeInstanceOf(Date);
  });

  it('should create appointment with null notes', async () => {
    const input = {
      ...testInput,
      patient_id: patientId,
      doctor_id: doctorId,
      notes: undefined
    };

    const result = await createAppointment(input);

    expect(result.notes).toBeNull();
    expect(result.patient_id).toEqual(patientId);
    expect(result.doctor_id).toEqual(doctorId);
  });

  it('should throw error for non-existent patient', async () => {
    const input = {
      ...testInput,
      patient_id: 99999,
      doctor_id: doctorId
    };

    await expect(createAppointment(input)).rejects.toThrow(/patient with id 99999 not found/i);
  });

  it('should throw error for non-existent doctor', async () => {
    const input = {
      ...testInput,
      patient_id: patientId,
      doctor_id: 99999
    };

    await expect(createAppointment(input)).rejects.toThrow(/doctor with id 99999 not found/i);
  });

  it('should throw error for inactive doctor', async () => {
    // Create an inactive doctor
    const inactiveDoctor = await db.insert(doctorsTable)
      .values({
        company_id: companyId,
        department_id: departmentId,
        first_name: 'Dr. Inactive',
        last_name: 'Doctor',
        email: 'inactive@clinic.com',
        phone: '555-0127',
        specialization: 'General',
        license_number: 'DOC456',
        is_active: false
      })
      .returning()
      .execute();

    const input = {
      ...testInput,
      patient_id: patientId,
      doctor_id: inactiveDoctor[0].id
    };

    await expect(createAppointment(input)).rejects.toThrow(/doctor with id .* is not active/i);
  });
});
