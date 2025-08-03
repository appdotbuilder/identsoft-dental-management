
import { db } from '../db';
import { prescriptionsTable } from '../db/schema';
import { type Prescription } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getPrescriptions = async (patientId?: number, doctorId?: number): Promise<Prescription[]> => {
  try {
    // Build query based on parameters
    let results;

    if (patientId !== undefined && doctorId !== undefined) {
      // Filter by both patient and doctor
      results = await db.select()
        .from(prescriptionsTable)
        .where(
          and(
            eq(prescriptionsTable.patient_id, patientId),
            eq(prescriptionsTable.doctor_id, doctorId)
          )
        )
        .execute();
    } else if (patientId !== undefined) {
      // Filter by patient only
      results = await db.select()
        .from(prescriptionsTable)
        .where(eq(prescriptionsTable.patient_id, patientId))
        .execute();
    } else if (doctorId !== undefined) {
      // Filter by doctor only
      results = await db.select()
        .from(prescriptionsTable)
        .where(eq(prescriptionsTable.doctor_id, doctorId))
        .execute();
    } else {
      // No filters - get all prescriptions
      results = await db.select()
        .from(prescriptionsTable)
        .execute();
    }

    return results;
  } catch (error) {
    console.error('Get prescriptions failed:', error);
    throw error;
  }
};
