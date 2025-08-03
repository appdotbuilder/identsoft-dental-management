
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, patientsTable, invoicesTable } from '../db/schema';
import { type CreateCompanyInput, type CreatePatientInput, type CreateInvoiceInput } from '../schema';
import { getInvoices } from '../handlers/get_invoices';

// Test data
const testCompany: CreateCompanyInput = {
  name: 'Test Clinic',
  address: '123 Test St',
  phone: '555-0123',
  email: 'test@clinic.com',
  license_number: 'LIC123'
};

const testPatient: CreatePatientInput = {
  company_id: 1, // Will be set after company creation
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  phone: '555-0456',
  date_of_birth: new Date('1990-01-01'),
  address: '456 Patient St',
  insurance_number: 'INS123',
  emergency_contact: '555-0789'
};

const testInvoice: CreateInvoiceInput = {
  patient_id: 1, // Will be set after patient creation
  company_id: 1, // Will be set after company creation
  total_amount: 250.75,
  due_date: new Date('2024-02-01'),
  notes: 'Test invoice'
};

describe('getInvoices', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve all invoices when no filters provided', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values(testCompany)
      .returning()
      .execute();

    const patient = await db.insert(patientsTable)
      .values({
        ...testPatient,
        company_id: company[0].id,
        date_of_birth: '1990-01-01' // Convert Date to string
      })
      .returning()
      .execute();

    // Create test invoice with generated invoice number
    await db.insert(invoicesTable)
      .values({
        patient_id: patient[0].id,
        company_id: company[0].id,
        invoice_number: 'INV-001',
        total_amount: testInvoice.total_amount.toString(),
        paid_amount: '0',
        due_date: '2024-02-01', // Convert Date to string
        notes: testInvoice.notes || null
      })
      .execute();

    const result = await getInvoices();

    expect(result).toHaveLength(1);
    expect(result[0].patient_id).toEqual(patient[0].id);
    expect(result[0].company_id).toEqual(company[0].id);
    expect(result[0].total_amount).toEqual(250.75);
    expect(result[0].paid_amount).toEqual(0);
    expect(typeof result[0].total_amount).toBe('number');
    expect(typeof result[0].paid_amount).toBe('number');
    expect(result[0].invoice_number).toEqual('INV-001');
    expect(result[0].due_date).toBeInstanceOf(Date);
  });

  it('should filter invoices by patient_id', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values(testCompany)
      .returning()
      .execute();

    const patient1 = await db.insert(patientsTable)
      .values({
        ...testPatient,
        company_id: company[0].id,
        date_of_birth: '1990-01-01'
      })
      .returning()
      .execute();

    const patient2 = await db.insert(patientsTable)
      .values({
        ...testPatient,
        company_id: company[0].id,
        email: 'jane@example.com',
        first_name: 'Jane',
        date_of_birth: '1990-01-01'
      })
      .returning()
      .execute();

    // Create invoices for both patients
    await db.insert(invoicesTable)
      .values({
        patient_id: patient1[0].id,
        company_id: company[0].id,
        invoice_number: 'INV-001',
        total_amount: testInvoice.total_amount.toString(),
        paid_amount: '0',
        due_date: '2024-02-01',
        notes: testInvoice.notes || null
      })
      .execute();

    await db.insert(invoicesTable)
      .values({
        patient_id: patient2[0].id,
        company_id: company[0].id,
        invoice_number: 'INV-002',
        total_amount: '150.50',
        paid_amount: '0',
        due_date: '2024-02-01',
        notes: null
      })
      .execute();

    const result = await getInvoices(patient1[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].patient_id).toEqual(patient1[0].id);
    expect(result[0].total_amount).toEqual(250.75);
  });

  it('should filter invoices by company_id', async () => {
    // Create two companies
    const company1 = await db.insert(companiesTable)
      .values(testCompany)
      .returning()
      .execute();

    const company2 = await db.insert(companiesTable)
      .values({
        ...testCompany,
        name: 'Second Clinic',
        email: 'second@clinic.com',
        license_number: 'LIC456'
      })
      .returning()
      .execute();

    // Create patients for each company
    const patient1 = await db.insert(patientsTable)
      .values({
        ...testPatient,
        company_id: company1[0].id,
        date_of_birth: '1990-01-01'
      })
      .returning()
      .execute();

    const patient2 = await db.insert(patientsTable)
      .values({
        ...testPatient,
        company_id: company2[0].id,
        email: 'jane@example.com',
        date_of_birth: '1990-01-01'
      })
      .returning()
      .execute();

    // Create invoices for each company
    await db.insert(invoicesTable)
      .values({
        patient_id: patient1[0].id,
        company_id: company1[0].id,
        invoice_number: 'INV-001',
        total_amount: testInvoice.total_amount.toString(),
        paid_amount: '0',
        due_date: '2024-02-01',
        notes: testInvoice.notes || null
      })
      .execute();

    await db.insert(invoicesTable)
      .values({
        patient_id: patient2[0].id,
        company_id: company2[0].id,
        invoice_number: 'INV-002',
        total_amount: '300.00',
        paid_amount: '0',
        due_date: '2024-02-01',
        notes: null
      })
      .execute();

    const result = await getInvoices(undefined, company1[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].company_id).toEqual(company1[0].id);
    expect(result[0].total_amount).toEqual(250.75);
  });

  it('should filter invoices by both patient_id and company_id', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values(testCompany)
      .returning()
      .execute();

    const patient = await db.insert(patientsTable)
      .values({
        ...testPatient,
        company_id: company[0].id,
        date_of_birth: '1990-01-01'
      })
      .returning()
      .execute();

    // Create test invoice
    await db.insert(invoicesTable)
      .values({
        patient_id: patient[0].id,
        company_id: company[0].id,
        invoice_number: 'INV-001',
        total_amount: testInvoice.total_amount.toString(),
        paid_amount: '50.25',
        due_date: '2024-02-01',
        notes: testInvoice.notes || null
      })
      .execute();

    const result = await getInvoices(patient[0].id, company[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].patient_id).toEqual(patient[0].id);
    expect(result[0].company_id).toEqual(company[0].id);
    expect(result[0].total_amount).toEqual(250.75);
    expect(result[0].paid_amount).toEqual(50.25);
  });

  it('should return empty array when no invoices match filters', async () => {
    const result = await getInvoices(999, 999);
    expect(result).toHaveLength(0);
  });

  it('should handle invoices with different statuses and amounts', async () => {
    // Create prerequisite data
    const company = await db.insert(companiesTable)
      .values(testCompany)
      .returning()
      .execute();

    const patient = await db.insert(patientsTable)
      .values({
        ...testPatient,
        company_id: company[0].id,
        date_of_birth: '1990-01-01'
      })
      .returning()
      .execute();

    // Create invoices with different statuses
    await db.insert(invoicesTable)
      .values([
        {
          patient_id: patient[0].id,
          company_id: company[0].id,
          invoice_number: 'INV-001',
          total_amount: '100.00',
          paid_amount: '100.00',
          status: 'paid' as const,
          due_date: '2024-01-01',
          notes: null
        },
        {
          patient_id: patient[0].id,
          company_id: company[0].id,
          invoice_number: 'INV-002',
          total_amount: '200.50',
          paid_amount: '0',
          status: 'overdue' as const,
          due_date: '2024-01-15',
          notes: 'Overdue invoice'
        }
      ])
      .execute();

    const result = await getInvoices(patient[0].id);

    expect(result).toHaveLength(2);
    expect(result[0].total_amount).toEqual(100);
    expect(result[0].paid_amount).toEqual(100);
    expect(result[0].status).toEqual('paid');
    expect(result[0].due_date).toBeInstanceOf(Date);
    expect(result[1].total_amount).toEqual(200.5);
    expect(result[1].paid_amount).toEqual(0);
    expect(result[1].status).toEqual('overdue');
    expect(result[1].due_date).toBeInstanceOf(Date);
  });
});
