
import { db } from '../db';
import { doctorsTable } from '../db/schema';
import { type Doctor } from '../schema';
import { eq, and, SQL } from 'drizzle-orm';

export const getDoctors = async (companyId?: number, departmentId?: number): Promise<Doctor[]> => {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (companyId !== undefined) {
      conditions.push(eq(doctorsTable.company_id, companyId));
    }

    if (departmentId !== undefined) {
      conditions.push(eq(doctorsTable.department_id, departmentId));
    }

    // Execute query with or without conditions
    const results = conditions.length > 0
      ? await db.select()
          .from(doctorsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute()
      : await db.select()
          .from(doctorsTable)
          .execute();

    // Return the results as-is since no numeric conversions are needed
    return results;
  } catch (error) {
    console.error('Failed to get doctors:', error);
    throw error;
  }
};
