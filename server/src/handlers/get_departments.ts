
import { db } from '../db';
import { departmentsTable } from '../db/schema';
import { type Department } from '../schema';
import { eq } from 'drizzle-orm';

export const getDepartments = async (companyId?: number): Promise<Department[]> => {
  try {
    if (companyId !== undefined) {
      const results = await db.select()
        .from(departmentsTable)
        .where(eq(departmentsTable.company_id, companyId))
        .execute();
      
      return results;
    }

    const results = await db.select()
      .from(departmentsTable)
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch departments:', error);
    throw error;
  }
};
