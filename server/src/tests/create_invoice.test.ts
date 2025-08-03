
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { invoicesTable, companiesTable, patientsTable } from '../db/schema';
import { type CreateInvoiceInput } from '../schema';
import { createInvoice } from '../handlers/create_invoice';
import { eq, and } from 'drizzle-orm';

describe('createInvoice', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let companyId: number;
  let patientId: number;

  beforeEach(async () => {
    // Create test company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Medical St',
        phone: '+1234567890',
        email: 'info@testclinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();
    companyId = companyResult[0].id;

    // Create test patient
    const patientResult = await db.insert(patientsTable)
      .values({
        company_id: companyId,
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        date_of_birth: '1990-01-01', // Use string format for date
        address: '456 Patient Ave'
      })
      .returning()
      .execute();
    patientId = patientResult[0].id;
  });

  const testInput: CreateInvoiceInput = {
    patient_id: 0, // Will be set in beforeEach
    company_id: 0, // Will be set in beforeEach
    total_amount: 250.75,
    due_date: new Date('2024-02-15'),
    notes: 'Test invoice for consultation'
  };

  it('should create an invoice', async () => {
    const input = { ...testInput, patient_id: patientId, company_id: companyId };
    const result = await createInvoice(input);

    // Basic field validation
    expect(result.patient_id).toEqual(patientId);
    expect(result.company_id).toEqual(companyId);
    expect(result.total_amount).toEqual(250.75);
    expect(typeof result.total_amount).toBe('number');
    expect(result.paid_amount).toEqual(0);
    expect(typeof result.paid_amount).toBe('number');
    expect(result.status).toEqual('draft');
    expect(result.due_date).toEqual(new Date('2024-02-15'));
    expect(result.notes).toEqual('Test invoice for consultation');
    expect(result.id).toBeDefined();
    expect(result.invoice_number).toMatch(/^INV-\d+-\d{4}$/);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save invoice to database', async () => {
    const input = { ...testInput, patient_id: patientId, company_id: companyId };
    const result = await createInvoice(input);

    const invoices = await db.select()
      .from(invoicesTable)
      .where(eq(invoicesTable.id, result.id))
      .execute();

    expect(invoices).toHaveLength(1);
    expect(invoices[0].patient_id).toEqual(patientId);
    expect(invoices[0].company_id).toEqual(companyId);
    expect(parseFloat(invoices[0].total_amount)).toEqual(250.75);
    expect(parseFloat(invoices[0].paid_amount)).toEqual(0);
    expect(invoices[0].status).toEqual('draft');
    expect(new Date(invoices[0].due_date)).toEqual(new Date('2024-02-15'));
    expect(invoices[0].notes).toEqual('Test invoice for consultation');
    expect(invoices[0].invoice_number).toMatch(/^INV-\d+-\d{4}$/);
    expect(invoices[0].created_at).toBeInstanceOf(Date);
  });

  it('should generate sequential invoice numbers for same company', async () => {
    const input = { ...testInput, patient_id: patientId, company_id: companyId };
    
    const invoice1 = await createInvoice(input);
    const invoice2 = await createInvoice(input);
    const invoice3 = await createInvoice(input);

    expect(invoice1.invoice_number).toEqual(`INV-${companyId}-0001`);
    expect(invoice2.invoice_number).toEqual(`INV-${companyId}-0002`);
    expect(invoice3.invoice_number).toEqual(`INV-${companyId}-0003`);
  });

  it('should throw error when company does not exist', async () => {
    const input = { ...testInput, patient_id: patientId, company_id: 99999 };
    
    expect(createInvoice(input)).rejects.toThrow(/company with id 99999 not found/i);
  });

  it('should throw error when patient does not exist', async () => {
    const input = { ...testInput, patient_id: 99999, company_id: companyId };
    
    expect(createInvoice(input)).rejects.toThrow(/patient with id 99999 not found/i);
  });

  it('should throw error when patient does not belong to company', async () => {
    // Create another company
    const anotherCompanyResult = await db.insert(companiesTable)
      .values({
        name: 'Another Clinic',
        address: '789 Another St',
        phone: '+1987654321',
        email: 'info@anotherclinic.com',
        license_number: 'LIC456'
      })
      .returning()
      .execute();
    const anotherCompanyId = anotherCompanyResult[0].id;

    const input = { ...testInput, patient_id: patientId, company_id: anotherCompanyId };
    
    expect(createInvoice(input)).rejects.toThrow(/patient with id \d+ not found or does not belong to company \d+/i);
  });

  it('should handle null notes', async () => {
    const input = { 
      patient_id: patientId, 
      company_id: companyId,
      total_amount: 100.00,
      due_date: new Date('2024-03-01')
      // notes is undefined
    };
    
    const result = await createInvoice(input);
    
    expect(result.notes).toBeNull();
  });
});
