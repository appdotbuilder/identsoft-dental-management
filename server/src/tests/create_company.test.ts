
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable } from '../db/schema';
import { type CreateCompanyInput } from '../schema';
import { createCompany } from '../handlers/create_company';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateCompanyInput = {
  name: 'Test Medical Clinic',
  address: '123 Main Street, City, State 12345',
  phone: '+1-555-123-4567',
  email: 'info@testclinic.com',
  license_number: 'MC-12345-ABC'
};

describe('createCompany', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a company', async () => {
    const result = await createCompany(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Medical Clinic');
    expect(result.address).toEqual(testInput.address);
    expect(result.phone).toEqual(testInput.phone);
    expect(result.email).toEqual(testInput.email);
    expect(result.license_number).toEqual(testInput.license_number);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save company to database', async () => {
    const result = await createCompany(testInput);

    // Query using proper drizzle syntax
    const companies = await db.select()
      .from(companiesTable)
      .where(eq(companiesTable.id, result.id))
      .execute();

    expect(companies).toHaveLength(1);
    expect(companies[0].name).toEqual('Test Medical Clinic');
    expect(companies[0].address).toEqual(testInput.address);
    expect(companies[0].phone).toEqual(testInput.phone);
    expect(companies[0].email).toEqual(testInput.email);
    expect(companies[0].license_number).toEqual(testInput.license_number);
    expect(companies[0].created_at).toBeInstanceOf(Date);
    expect(companies[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle unique email addresses', async () => {
    // Create first company
    await createCompany(testInput);

    // Try to create another company with same email
    const duplicateInput: CreateCompanyInput = {
      ...testInput,
      name: 'Another Clinic',
      license_number: 'MC-67890-XYZ'
    };

    // Should still work since we don't have unique constraints in schema
    const result = await createCompany(duplicateInput);
    expect(result.name).toEqual('Another Clinic');
    expect(result.email).toEqual(testInput.email);
  });

  it('should create companies with different details', async () => {
    const secondInput: CreateCompanyInput = {
      name: 'Dental Care Plus',
      address: '456 Oak Avenue, Another City, State 67890',
      phone: '+1-555-987-6543',
      email: 'contact@dentalcareplus.com',
      license_number: 'DC-98765-XYZ'
    };

    const first = await createCompany(testInput);
    const second = await createCompany(secondInput);

    expect(first.id).not.toEqual(second.id);
    expect(first.name).toEqual('Test Medical Clinic');
    expect(second.name).toEqual('Dental Care Plus');
    expect(first.email).toEqual('info@testclinic.com');
    expect(second.email).toEqual('contact@dentalcareplus.com');
  });
});
