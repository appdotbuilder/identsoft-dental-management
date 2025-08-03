
import { db } from '../db';
import { invoicesTable } from '../db/schema';
import { type Invoice } from '../schema';
import { eq, and } from 'drizzle-orm';

export const getInvoices = async (patientId?: number, companyId?: number): Promise<Invoice[]> => {
  try {
    let results;

    // Handle different filter combinations
    if (patientId !== undefined && companyId !== undefined) {
      // Both filters
      results = await db.select()
        .from(invoicesTable)
        .where(and(
          eq(invoicesTable.patient_id, patientId),
          eq(invoicesTable.company_id, companyId)
        ))
        .execute();
    } else if (patientId !== undefined) {
      // Patient filter only
      results = await db.select()
        .from(invoicesTable)
        .where(eq(invoicesTable.patient_id, patientId))
        .execute();
    } else if (companyId !== undefined) {
      // Company filter only
      results = await db.select()
        .from(invoicesTable)
        .where(eq(invoicesTable.company_id, companyId))
        .execute();
    } else {
      // No filters
      results = await db.select()
        .from(invoicesTable)
        .execute();
    }

    // Convert numeric fields to numbers and date strings to Date objects
    return results.map(invoice => ({
      ...invoice,
      total_amount: parseFloat(invoice.total_amount),
      paid_amount: parseFloat(invoice.paid_amount),
      due_date: new Date(invoice.due_date)
    }));
  } catch (error) {
    console.error('Invoice retrieval failed:', error);
    throw error;
  }
};
