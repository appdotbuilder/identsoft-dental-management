
import { db } from '../db';
import { appointmentsTable, doctorsTable, patientsTable } from '../db/schema';
import { type CreateAppointmentInput, type Appointment } from '../schema';
import { eq } from 'drizzle-orm';

export const createAppointment = async (input: CreateAppointmentInput): Promise<Appointment> => {
  try {
    // Verify that the patient exists
    const patient = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, input.patient_id))
      .execute();

    if (patient.length === 0) {
      throw new Error(`Patient with ID ${input.patient_id} not found`);
    }

    // Verify that the doctor exists and is active
    const doctor = await db.select()
      .from(doctorsTable)
      .where(eq(doctorsTable.id, input.doctor_id))
      .execute();

    if (doctor.length === 0) {
      throw new Error(`Doctor with ID ${input.doctor_id} not found`);
    }

    if (!doctor[0].is_active) {
      throw new Error(`Doctor with ID ${input.doctor_id} is not active`);
    }

    // Insert appointment record
    const result = await db.insert(appointmentsTable)
      .values({
        patient_id: input.patient_id,
        doctor_id: input.doctor_id,
        appointment_date: input.appointment_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        appointment_time: input.appointment_time,
        notes: input.notes || null
      })
      .returning()
      .execute();

    // Convert date string back to Date object and normalize time format for return type
    const appointment = result[0];
    return {
      ...appointment,
      appointment_date: new Date(appointment.appointment_date),
      appointment_time: appointment.appointment_time.substring(0, 5) // Remove seconds (HH:MM:SS -> HH:MM)
    };
  } catch (error) {
    console.error('Appointment creation failed:', error);
    throw error;
  }
};
