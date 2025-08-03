
import { db } from '../db';
import { appointmentsTable } from '../db/schema';
import { type Appointment } from '../schema';
import { eq, and, SQL } from 'drizzle-orm';

export const getAppointments = async (doctorId?: number, patientId?: number): Promise<Appointment[]> => {
  try {
    const conditions: SQL<unknown>[] = [];

    if (doctorId !== undefined) {
      conditions.push(eq(appointmentsTable.doctor_id, doctorId));
    }

    if (patientId !== undefined) {
      conditions.push(eq(appointmentsTable.patient_id, patientId));
    }

    const results = conditions.length > 0
      ? await db.select()
          .from(appointmentsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute()
      : await db.select()
          .from(appointmentsTable)
          .execute();

    return results.map(appointment => ({
      ...appointment,
      appointment_date: new Date(appointment.appointment_date), // Convert string to Date
      // appointment_time is already a string from time column
      // created_at is automatically converted to Date object
    }));
  } catch (error) {
    console.error('Failed to get appointments:', error);
    throw error;
  }
};
