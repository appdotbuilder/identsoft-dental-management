
import { db } from '../db';
import { doctorSchedulesTable, doctorsTable } from '../db/schema';
import { type CreateDoctorScheduleInput, type DoctorSchedule } from '../schema';
import { eq } from 'drizzle-orm';

export const createDoctorSchedule = async (input: CreateDoctorScheduleInput): Promise<DoctorSchedule> => {
  try {
    // Verify doctor exists first to ensure referential integrity
    const doctor = await db.select()
      .from(doctorsTable)
      .where(eq(doctorsTable.id, input.doctor_id))
      .execute();

    if (doctor.length === 0) {
      throw new Error(`Doctor with id ${input.doctor_id} does not exist`);
    }

    // Insert doctor schedule record
    const result = await db.insert(doctorSchedulesTable)
      .values({
        doctor_id: input.doctor_id,
        day_of_week: input.day_of_week,
        start_time: input.start_time,
        end_time: input.end_time,
        is_available: true // Default to available
      })
      .returning()
      .execute();

    // Convert time format from HH:MM:SS to HH:MM for consistency with input
    const schedule = result[0];
    return {
      ...schedule,
      start_time: schedule.start_time.substring(0, 5), // Convert "09:00:00" to "09:00"
      end_time: schedule.end_time.substring(0, 5) // Convert "17:00:00" to "17:00"
    };
  } catch (error) {
    console.error('Doctor schedule creation failed:', error);
    throw error;
  }
};
