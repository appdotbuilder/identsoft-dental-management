
import { db } from '../db';
import { caseStudiesTable } from '../db/schema';
import { type CaseStudy } from '../schema';
import { eq, and, SQL } from 'drizzle-orm';

export const getCaseStudies = async (patientId?: number, doctorId?: number): Promise<CaseStudy[]> => {
  try {
    // Build conditions array for filters
    const conditions: SQL<unknown>[] = [];

    if (patientId !== undefined) {
      conditions.push(eq(caseStudiesTable.patient_id, patientId));
    }

    if (doctorId !== undefined) {
      conditions.push(eq(caseStudiesTable.doctor_id, doctorId));
    }

    // Execute query with or without conditions
    const results = conditions.length > 0
      ? await db.select().from(caseStudiesTable).where(conditions.length === 1 ? conditions[0] : and(...conditions)).execute()
      : await db.select().from(caseStudiesTable).execute();

    // Return results as they match the CaseStudy type structure
    return results;
  } catch (error) {
    console.error('Failed to get case studies:', error);
    throw error;
  }
};
