
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable } from '../db/schema';
import { type CreateCompanyInput } from '../schema';
import { getCompanies } from '../handlers/get_companies';

// Test company data
const testCompany1: CreateCompanyInput = {
  name: 'Smile Dental Clinic',
  address: '123 Main St, City',
  phone: '+1-555-0123',
  email: 'info@smile-dental.com',
  license_number: 'DC-2024-001'
};

const testCompany2: CreateCompanyInput = {
  name: 'Bright Teeth Center',
  address: '456 Oak Ave, Town',
  phone: '+1-555-0456',
  email: 'contact@bright-teeth.com',
  license_number: 'DC-2024-002'
};

describe('getCompanies', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no companies exist', async () => {
    const result = await getCompanies();

    expect(result).toEqual([]);
  });

  it('should return all companies', async () => {
    // Create test companies
    await db.insert(companiesTable)
      .values([testCompany1, testCompany2])
      .execute();

    const result = await getCompanies();

    expect(result).toHaveLength(2);
    
    // Check first company
    expect(result[0].name).toEqual('Smile Dental Clinic');
    expect(result[0].address).toEqual('123 Main St, City');
    expect(result[0].phone).toEqual('+1-555-0123');
    expect(result[0].email).toEqual('info@smile-dental.com');
    expect(result[0].license_number).toEqual('DC-2024-001');
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);

    // Check second company
    expect(result[1].name).toEqual('Bright Teeth Center');
    expect(result[1].address).toEqual('456 Oak Ave, Town');
    expect(result[1].phone).toEqual('+1-555-0456');
    expect(result[1].email).toEqual('contact@bright-teeth.com');
    expect(result[1].license_number).toEqual('DC-2024-002');
    expect(result[1].id).toBeDefined();
    expect(result[1].created_at).toBeInstanceOf(Date);
    expect(result[1].updated_at).toBeInstanceOf(Date);
  });

  it('should return companies in creation order', async () => {
    // Create companies with slight delay to ensure different timestamps
    await db.insert(companiesTable)
      .values(testCompany1)
      .execute();

    await db.insert(companiesTable)
      .values(testCompany2)
      .execute();

    const result = await getCompanies();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Smile Dental Clinic');
    expect(result[1].name).toEqual('Bright Teeth Center');
    expect(result[0].created_at.getTime()).toBeLessThanOrEqual(result[1].created_at.getTime());
  });
});
