
import { db } from '../db';
import { paymentsTable } from '../db/schema';
import { type Payment } from '../schema';
import { eq } from 'drizzle-orm';

export const getPayments = async (invoiceId?: number): Promise<Payment[]> => {
  try {
    // Execute different queries based on filter
    const results = invoiceId !== undefined
      ? await db.select().from(paymentsTable).where(eq(paymentsTable.invoice_id, invoiceId)).execute()
      : await db.select().from(paymentsTable).execute();

    // Convert numeric and date fields to proper types
    return results.map(payment => ({
      ...payment,
      amount: parseFloat(payment.amount),
      payment_date: new Date(payment.payment_date)
    }));
  } catch (error) {
    console.error('Failed to fetch payments:', error);
    throw error;
  }
};
