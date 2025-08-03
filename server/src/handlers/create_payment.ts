
import { db } from '../db';
import { paymentsTable, invoicesTable } from '../db/schema';
import { type CreatePaymentInput, type Payment } from '../schema';
import { eq } from 'drizzle-orm';

export const createPayment = async (input: CreatePaymentInput): Promise<Payment> => {
  try {
    // Verify invoice exists before creating payment
    const existingInvoice = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, input.invoice_id))
      .execute();

    if (existingInvoice.length === 0) {
      throw new Error(`Invoice with ID ${input.invoice_id} not found`);
    }

    // Convert date to string format for database storage
    const paymentDateString = input.payment_date.toISOString().split('T')[0];

    // Insert payment record
    const result = await db.insert(paymentsTable)
      .values({
        invoice_id: input.invoice_id,
        amount: input.amount.toString(), // Convert number to string for numeric column
        payment_method: input.payment_method,
        payment_date: paymentDateString, // Convert Date to string
        reference_number: input.reference_number,
        notes: input.notes
      })
      .returning()
      .execute();

    // Update invoice paid amount
    const invoice = existingInvoice[0];
    const currentPaidAmount = parseFloat(invoice.paid_amount);
    const newPaidAmount = currentPaidAmount + input.amount;

    await db.update(invoicesTable)
      .set({
        paid_amount: newPaidAmount.toString() // Convert number to string for numeric column
      })
      .where(eq(invoicesTable.id, input.invoice_id))
      .execute();

    // Convert fields back to proper types before returning
    const payment = result[0];
    return {
      ...payment,
      amount: parseFloat(payment.amount), // Convert string back to number
      payment_date: new Date(payment.payment_date) // Convert string back to Date
    };
  } catch (error) {
    console.error('Payment creation failed:', error);
    throw error;
  }
};
