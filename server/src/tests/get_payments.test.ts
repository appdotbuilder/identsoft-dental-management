
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, patientsTable, invoicesTable, paymentsTable } from '../db/schema';
import { type CreateCompanyInput, type CreatePatientInput, type CreateInvoiceInput, type CreatePaymentInput } from '../schema';
import { getPayments } from '../handlers/get_payments';

// Test data
const testCompany: CreateCompanyInput = {
  name: 'Test Clinic',
  address: '123 Test St',
  phone: '555-0123',
  email: 'test@clinic.com',
  license_number: 'LIC123'
};

const testPatient: CreatePatientInput = {
  company_id: 1,
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  phone: '555-0123',
  date_of_birth: new Date('1990-01-01'),
  address: '123 Main St',
  insurance_number: 'INS123',
  emergency_contact: 'Jane Doe - 555-0124'
};

const testInvoice: CreateInvoiceInput = {
  patient_id: 1,
  company_id: 1,
  total_amount: 250.00,
  due_date: new Date('2024-02-01'),
  notes: 'Test invoice'
};

const testPayment1: CreatePaymentInput = {
  invoice_id: 1,
  amount: 100.00,
  payment_method: 'cash',
  payment_date: new Date('2024-01-15'),
  reference_number: 'REF001',
  notes: 'First payment'
};

const testPayment2: CreatePaymentInput = {
  invoice_id: 1,
  amount: 150.00,
  payment_method: 'card',
  payment_date: new Date('2024-01-20'),
  reference_number: 'REF002',
  notes: 'Second payment'
};

const testPayment3: CreatePaymentInput = {
  invoice_id: 2,
  amount: 75.00,
  payment_method: 'bank_transfer',
  payment_date: new Date('2024-01-18'),
  reference_number: 'REF003',
  notes: 'Different invoice payment'
};

describe('getPayments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all payments when no invoice filter is provided', async () => {
    // Create prerequisite data
    await db.insert(companiesTable).values(testCompany).execute();
    await db.insert(patientsTable).values({
      ...testPatient,
      date_of_birth: testPatient.date_of_birth.toISOString().split('T')[0]
    }).execute();
    
    // Create two invoices
    await db.insert(invoicesTable).values([
      {
        ...testInvoice,
        invoice_number: 'INV001',
        total_amount: testInvoice.total_amount.toString(),
        due_date: testInvoice.due_date.toISOString().split('T')[0]
      },
      {
        patient_id: 1,
        company_id: 1,
        invoice_number: 'INV002',
        total_amount: '75.00',
        due_date: '2024-02-15'
      }
    ]).execute();

    // Create payments for both invoices
    await db.insert(paymentsTable).values([
      {
        ...testPayment1,
        amount: testPayment1.amount.toString(),
        payment_date: testPayment1.payment_date.toISOString().split('T')[0]
      },
      {
        ...testPayment2,
        amount: testPayment2.amount.toString(),
        payment_date: testPayment2.payment_date.toISOString().split('T')[0]
      },
      {
        ...testPayment3,
        amount: testPayment3.amount.toString(),
        payment_date: testPayment3.payment_date.toISOString().split('T')[0]
      }
    ]).execute();

    const result = await getPayments();

    expect(result).toHaveLength(3);
    expect(result[0].amount).toBe(100.00);
    expect(typeof result[0].amount).toBe('number');
    expect(result[0].payment_method).toBe('cash');
    expect(result[0].reference_number).toBe('REF001');
    expect(result[0].payment_date).toBeInstanceOf(Date);
    expect(result[1].amount).toBe(150.00);
    expect(result[1].payment_method).toBe('card');
    expect(result[1].payment_date).toBeInstanceOf(Date);
    expect(result[2].amount).toBe(75.00);
    expect(result[2].invoice_id).toBe(2);
  });

  it('should return payments filtered by invoice ID', async () => {
    // Create prerequisite data
    await db.insert(companiesTable).values(testCompany).execute();
    await db.insert(patientsTable).values({
      ...testPatient,
      date_of_birth: testPatient.date_of_birth.toISOString().split('T')[0]
    }).execute();
    
    // Create two invoices
    await db.insert(invoicesTable).values([
      {
        ...testInvoice,
        invoice_number: 'INV001',
        total_amount: testInvoice.total_amount.toString(),
        due_date: testInvoice.due_date.toISOString().split('T')[0]
      },
      {
        patient_id: 1,
        company_id: 1,
        invoice_number: 'INV002',
        total_amount: '75.00',
        due_date: '2024-02-15'
      }
    ]).execute();

    // Create payments for both invoices
    await db.insert(paymentsTable).values([
      {
        ...testPayment1,
        amount: testPayment1.amount.toString(),
        payment_date: testPayment1.payment_date.toISOString().split('T')[0]
      },
      {
        ...testPayment2,
        amount: testPayment2.amount.toString(),
        payment_date: testPayment2.payment_date.toISOString().split('T')[0]
      },
      {
        ...testPayment3,
        amount: testPayment3.amount.toString(),
        payment_date: testPayment3.payment_date.toISOString().split('T')[0]
      }
    ]).execute();

    const result = await getPayments(1);

    expect(result).toHaveLength(2);
    expect(result[0].invoice_id).toBe(1);
    expect(result[0].amount).toBe(100.00);
    expect(result[0].payment_date).toBeInstanceOf(Date);
    expect(result[1].invoice_id).toBe(1);
    expect(result[1].amount).toBe(150.00);
    expect(result[1].payment_date).toBeInstanceOf(Date);
    
    // Verify all returned payments belong to the specified invoice
    result.forEach(payment => {
      expect(payment.invoice_id).toBe(1);
    });
  });

  it('should return empty array when no payments exist', async () => {
    const result = await getPayments();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array when filtering by non-existent invoice', async () => {
    // Create prerequisite data
    await db.insert(companiesTable).values(testCompany).execute();
    await db.insert(patientsTable).values({
      ...testPatient,
      date_of_birth: testPatient.date_of_birth.toISOString().split('T')[0]
    }).execute();
    await db.insert(invoicesTable).values({
      ...testInvoice,
      invoice_number: 'INV001',
      total_amount: testInvoice.total_amount.toString(),
      due_date: testInvoice.due_date.toISOString().split('T')[0]
    }).execute();

    // Create a payment for invoice 1
    await db.insert(paymentsTable).values({
      ...testPayment1,
      amount: testPayment1.amount.toString(),
      payment_date: testPayment1.payment_date.toISOString().split('T')[0]
    }).execute();

    const result = await getPayments(999);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle zero invoice ID filter correctly', async () => {
    // Create prerequisite data and payments
    await db.insert(companiesTable).values(testCompany).execute();
    await db.insert(patientsTable).values({
      ...testPatient,
      date_of_birth: testPatient.date_of_birth.toISOString().split('T')[0]
    }).execute();
    await db.insert(invoicesTable).values({
      ...testInvoice,
      invoice_number: 'INV001',
      total_amount: testInvoice.total_amount.toString(),
      due_date: testInvoice.due_date.toISOString().split('T')[0]
    }).execute();

    await db.insert(paymentsTable).values({
      ...testPayment1,
      amount: testPayment1.amount.toString(),
      payment_date: testPayment1.payment_date.toISOString().split('T')[0]
    }).execute();

    const result = await getPayments(0);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });
});
