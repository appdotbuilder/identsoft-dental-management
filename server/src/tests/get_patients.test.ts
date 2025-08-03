
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, patientsTable } from '../db/schema';
import { type CreateCompanyInput, type CreatePatientInput } from '../schema';
import { getPatients } from '../handlers/get_patients';

const testCompanyInput: CreateCompanyInput = {
  name: 'Test Clinic',
  address: '123 Main St',
  phone: '555-0123',
  email: 'test@clinic.com',
  license_number: 'LIC123'
};

const testPatientInput: CreatePatientInput = {
  company_id: 1,
  first_name: 'John',
  last_name: 'Doe',
  email: 'john.doe@email.com',
  phone: '555-0100',
  date_of_birth: new Date('1990-01-15'),
  address: '456 Oak Street',
  insurance_number: 'INS123456',
  emergency_contact: 'Jane Doe - 555-0101'
};

describe('getPatients', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no patients exist', async () => {
    const result = await getPatients();

    expect(result).toEqual([]);
  });

  it('should return all patients when no company filter is provided', async () => {
    // Create prerequisite company
    const company = await db.insert(companiesTable)
      .values(testCompanyInput)
      .returning()
      .execute();

    // Create test patients - convert Date to string for date_of_birth
    await db.insert(patientsTable)
      .values([
        { 
          ...testPatientInput, 
          company_id: company[0].id,
          date_of_birth: testPatientInput.date_of_birth.toISOString().split('T')[0]
        },
        { 
          ...testPatientInput, 
          company_id: company[0].id,
          first_name: 'Jane',
          email: 'jane.doe@email.com',
          phone: '555-0102',
          date_of_birth: testPatientInput.date_of_birth.toISOString().split('T')[0]
        }
      ])
      .execute();

    const result = await getPatients();

    expect(result).toHaveLength(2);
    expect(result[0].first_name).toEqual('John');
    expect(result[0].last_name).toEqual('Doe');
    expect(result[0].email).toEqual('john.doe@email.com');
    expect(result[0].phone).toEqual('555-0100');
    expect(result[0].date_of_birth).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].company_id).toEqual(company[0].id);
    expect(result[1].first_name).toEqual('Jane');
  });

  it('should filter patients by company_id when provided', async () => {
    // Create two companies
    const company1 = await db.insert(companiesTable)
      .values(testCompanyInput)
      .returning()
      .execute();

    const company2 = await db.insert(companiesTable)
      .values({
        ...testCompanyInput,
        name: 'Second Clinic',
        email: 'second@clinic.com'
      })
      .returning()
      .execute();

    // Create patients for both companies
    await db.insert(patientsTable)
      .values([
        { 
          ...testPatientInput, 
          company_id: company1[0].id,
          date_of_birth: testPatientInput.date_of_birth.toISOString().split('T')[0]
        },
        { 
          ...testPatientInput, 
          company_id: company2[0].id,
          first_name: 'Jane',
          email: 'jane@email.com',
          date_of_birth: testPatientInput.date_of_birth.toISOString().split('T')[0]
        }
      ])
      .execute();

    const result = await getPatients(company1[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].first_name).toEqual('John');
    expect(result[0].company_id).toEqual(company1[0].id);
  });

  it('should return empty array for non-existent company', async () => {
    // Create company and patient
    const company = await db.insert(companiesTable)
      .values(testCompanyInput)
      .returning()
      .execute();

    await db.insert(patientsTable)
      .values({ 
        ...testPatientInput, 
        company_id: company[0].id,
        date_of_birth: testPatientInput.date_of_birth.toISOString().split('T')[0]
      })
      .execute();

    const result = await getPatients(999);

    expect(result).toEqual([]);
  });

  it('should handle patients with nullable fields correctly', async () => {
    // Create company
    const company = await db.insert(companiesTable)
      .values(testCompanyInput)
      .returning()
      .execute();

    // Create patient with nullable fields set to null
    await db.insert(patientsTable)
      .values({
        company_id: company[0].id,
        first_name: 'Test',
        last_name: 'Patient',
        email: null,
        phone: '555-0200',
        date_of_birth: '1985-05-20',
        address: '789 Pine St',
        insurance_number: null,
        emergency_contact: null
      })
      .execute();

    const result = await getPatients();

    expect(result).toHaveLength(1);
    expect(result[0].email).toBeNull();
    expect(result[0].insurance_number).toBeNull();
    expect(result[0].emergency_contact).toBeNull();
    expect(result[0].first_name).toEqual('Test');
    expect(result[0].date_of_birth).toBeInstanceOf(Date);
  });
});
