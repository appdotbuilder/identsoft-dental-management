
import { db } from '../db';
import { doctorSchedulesTable } from '../db/schema';
import { type DoctorSchedule } from '../schema';
import { eq } from 'drizzle-orm';

export const getDoctorSchedules = async (doctorId: number): Promise<DoctorSchedule[]> => {
  try {
    const results = await db.select()
      .from(doctorSchedulesTable)
      .where(eq(doctorSchedulesTable.doctor_id, doctorId))
      .execute();

    return results;
  } catch (error) {
    console.error('Get doctor schedules failed:', error);
    throw error;
  }
};
