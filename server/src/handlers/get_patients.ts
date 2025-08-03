
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type Patient } from '../schema';
import { eq } from 'drizzle-orm';

export const getPatients = async (companyId?: number): Promise<Patient[]> => {
  try {
    const baseQuery = db.select().from(patientsTable);
    
    const query = companyId !== undefined 
      ? baseQuery.where(eq(patientsTable.company_id, companyId))
      : baseQuery;

    const results = await query.execute();

    return results.map(patient => ({
      ...patient,
      date_of_birth: new Date(patient.date_of_birth),
      created_at: new Date(patient.created_at)
    }));
  } catch (error) {
    console.error('Failed to fetch patients:', error);
    throw error;
  }
};
