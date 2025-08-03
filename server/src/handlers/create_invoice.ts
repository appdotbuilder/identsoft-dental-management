
import { db } from '../db';
import { invoicesTable, companiesTable, patientsTable } from '../db/schema';
import { type CreateInvoiceInput, type Invoice } from '../schema';
import { eq, and, count } from 'drizzle-orm';

export const createInvoice = async (input: CreateInvoiceInput): Promise<Invoice> => {
  try {
    // Verify company exists
    const companies = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, input.company_id))
      .execute();

    if (companies.length === 0) {
      throw new Error(`Company with id ${input.company_id} not found`);
    }

    // Verify patient exists and belongs to the company
    const patients = await db.select()
      .from(patientsTable)
      .where(and(
        eq(patientsTable.id, input.patient_id),
        eq(patientsTable.company_id, input.company_id)
      ))
      .execute();

    if (patients.length === 0) {
      throw new Error(`Patient with id ${input.patient_id} not found or does not belong to company ${input.company_id}`);
    }

    // Generate invoice number based on company and sequence
    const invoiceCountResult = await db.select({ count: count() })
      .from(invoicesTable)
      .where(eq(invoicesTable.company_id, input.company_id))
      .execute();

    const nextSequence = (invoiceCountResult[0]?.count || 0) + 1;
    const invoiceNumber = `INV-${input.company_id}-${nextSequence.toString().padStart(4, '0')}`;

    // Insert invoice record
    const result = await db.insert(invoicesTable)
      .values({
        patient_id: input.patient_id,
        company_id: input.company_id,
        invoice_number: invoiceNumber,
        total_amount: input.total_amount.toString(),
        paid_amount: '0',
        status: 'draft',
        due_date: input.due_date.toISOString().split('T')[0], // Convert Date to string
        notes: input.notes || null
      })
      .returning()
      .execute();

    // Convert numeric and date fields back to proper types before returning
    const invoice = result[0];
    return {
      ...invoice,
      total_amount: parseFloat(invoice.total_amount),
      paid_amount: parseFloat(invoice.paid_amount),
      due_date: new Date(invoice.due_date) // Convert string back to Date
    };
  } catch (error) {
    console.error('Invoice creation failed:', error);
    throw error;
  }
};
