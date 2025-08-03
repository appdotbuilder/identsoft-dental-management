
import { db } from '../db';
import { labReportsTable } from '../db/schema';
import { type LabReport } from '../schema';
import { eq, and, type SQL } from 'drizzle-orm';

export const getLabReports = async (patientId?: number, doctorId?: number): Promise<LabReport[]> => {
  try {
    const conditions: SQL<unknown>[] = [];

    if (patientId !== undefined) {
      conditions.push(eq(labReportsTable.patient_id, patientId));
    }

    if (doctorId !== undefined) {
      conditions.push(eq(labReportsTable.doctor_id, doctorId));
    }

    const results = conditions.length === 0 
      ? await db.select().from(labReportsTable).execute()
      : conditions.length === 1
        ? await db.select().from(labReportsTable).where(conditions[0]).execute()
        : await db.select().from(labReportsTable).where(and(...conditions)).execute();

    return results.map(report => ({
      ...report,
      test_date: new Date(report.test_date) // Convert string to Date
    }));
  } catch (error) {
    console.error('Lab reports retrieval failed:', error);
    throw error;
  }
};
