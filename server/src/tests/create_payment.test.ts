
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { paymentsTable, invoicesTable, companiesTable, patientsTable } from '../db/schema';
import { type CreatePaymentInput } from '../schema';
import { createPayment } from '../handlers/create_payment';
import { eq } from 'drizzle-orm';

describe('createPayment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a payment and update invoice paid amount', async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Test St',
        phone: '555-0123',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    // Create prerequisite patient
    const patientResult = await db.insert(patientsTable)
      .values({
        company_id: companyResult[0].id,
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-0124',
        date_of_birth: '1990-01-01', // Use string format for date column
        address: '456 Patient St'
      })
      .returning()
      .execute();

    // Create prerequisite invoice
    const invoiceResult = await db.insert(invoicesTable)
      .values({
        patient_id: patientResult[0].id,
        company_id: companyResult[0].id,
        invoice_number: 'INV-001',
        total_amount: '100.00',
        paid_amount: '0.00',
        due_date: '2024-12-31' // Use string format for date column
      })
      .returning()
      .execute();

    const testInput: CreatePaymentInput = {
      invoice_id: invoiceResult[0].id,
      amount: 50.00,
      payment_method: 'cash',
      payment_date: new Date('2024-01-15'),
      reference_number: 'REF123',
      notes: 'Partial payment'
    };

    const result = await createPayment(testInput);

    // Verify payment fields
    expect(result.invoice_id).toEqual(invoiceResult[0].id);
    expect(result.amount).toEqual(50.00);
    expect(typeof result.amount).toBe('number');
    expect(result.payment_method).toEqual('cash');
    expect(result.payment_date).toEqual(testInput.payment_date);
    expect(result.reference_number).toEqual('REF123');
    expect(result.notes).toEqual('Partial payment');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save payment to database', async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Test St',
        phone: '555-0123',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    // Create prerequisite patient
    const patientResult = await db.insert(patientsTable)
      .values({
        company_id: companyResult[0].id,
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-0124',
        date_of_birth: '1990-01-01', // Use string format for date column
        address: '456 Patient St'
      })
      .returning()
      .execute();

    // Create prerequisite invoice
    const invoiceResult = await db.insert(invoicesTable)
      .values({
        patient_id: patientResult[0].id,
        company_id: companyResult[0].id,
        invoice_number: 'INV-001',
        total_amount: '100.00',
        paid_amount: '0.00',
        due_date: '2024-12-31' // Use string format for date column
      })
      .returning()
      .execute();

    const testInput: CreatePaymentInput = {
      invoice_id: invoiceResult[0].id,
      amount: 75.50,
      payment_method: 'card',
      payment_date: new Date('2024-01-15')
    };

    const result = await createPayment(testInput);

    // Query payment from database
    const payments = await db.select()
      .from(paymentsTable)
      .where(eq(paymentsTable.id, result.id))
      .execute();

    expect(payments).toHaveLength(1);
    expect(parseFloat(payments[0].amount)).toEqual(75.50);
    expect(payments[0].payment_method).toEqual('card');
    expect(payments[0].invoice_id).toEqual(invoiceResult[0].id);
    expect(payments[0].created_at).toBeInstanceOf(Date);
  });

  it('should update invoice paid amount correctly', async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Test St',
        phone: '555-0123',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    // Create prerequisite patient
    const patientResult = await db.insert(patientsTable)
      .values({
        company_id: companyResult[0].id,
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-0124',
        date_of_birth: '1990-01-01', // Use string format for date column
        address: '456 Patient St'
      })
      .returning()
      .execute();

    // Create prerequisite invoice with some existing payment
    const invoiceResult = await db.insert(invoicesTable)
      .values({
        patient_id: patientResult[0].id,
        company_id: companyResult[0].id,
        invoice_number: 'INV-001',
        total_amount: '200.00',
        paid_amount: '50.00', // Already has some payment
        due_date: '2024-12-31' // Use string format for date column
      })
      .returning()
      .execute();

    const testInput: CreatePaymentInput = {
      invoice_id: invoiceResult[0].id,
      amount: 30.00,
      payment_method: 'bank_transfer',
      payment_date: new Date('2024-01-15')
    };

    await createPayment(testInput);

    // Check updated invoice paid amount
    const updatedInvoice = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, invoiceResult[0].id))
      .execute();

    expect(updatedInvoice).toHaveLength(1);
    expect(parseFloat(updatedInvoice[0].paid_amount)).toEqual(80.00); // 50 + 30
  });

  it('should throw error for non-existent invoice', async () => {
    const testInput: CreatePaymentInput = {
      invoice_id: 99999, // Non-existent invoice ID
      amount: 50.00,
      payment_method: 'cash',
      payment_date: new Date('2024-01-15')
    };

    expect(createPayment(testInput)).rejects.toThrow(/invoice.*not found/i);
  });

  it('should handle optional fields correctly', async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Test St',
        phone: '555-0123',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    // Create prerequisite patient
    const patientResult = await db.insert(patientsTable)
      .values({
        company_id: companyResult[0].id,
        first_name: 'John',
        last_name: 'Doe',
        phone: '555-0124',
        date_of_birth: '1990-01-01', // Use string format for date column
        address: '456 Patient St'
      })
      .returning()
      .execute();

    // Create prerequisite invoice
    const invoiceResult = await db.insert(invoicesTable)
      .values({
        patient_id: patientResult[0].id,
        company_id: companyResult[0].id,
        invoice_number: 'INV-001',
        total_amount: '100.00',
        paid_amount: '0.00',
        due_date: '2024-12-31' // Use string format for date column
      })
      .returning()
      .execute();

    const testInput: CreatePaymentInput = {
      invoice_id: invoiceResult[0].id,
      amount: 25.00,
      payment_method: 'insurance',
      payment_date: new Date('2024-01-15')
      // reference_number and notes are optional and not provided
    };

    const result = await createPayment(testInput);

    expect(result.reference_number).toBeNull();
    expect(result.notes).toBeNull();
    expect(result.amount).toEqual(25.00);
    expect(result.payment_method).toEqual('insurance');
  });
});
