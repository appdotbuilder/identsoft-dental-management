
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, departmentsTable } from '../db/schema';
import { getDepartments } from '../handlers/get_departments';
import { eq } from 'drizzle-orm';

describe('getDepartments', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all departments when no company filter is provided', async () => {
    // Create test company
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Test St',
        phone: '555-0123',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    // Create test departments
    await db.insert(departmentsTable)
      .values([
        {
          company_id: company.id,
          name: 'Cardiology',
          description: 'Heart specialists'
        },
        {
          company_id: company.id,
          name: 'Neurology',
          description: 'Brain specialists'
        }
      ])
      .execute();

    const result = await getDepartments();

    expect(result).toHaveLength(2);
    expect(result[0].name).toEqual('Cardiology');
    expect(result[0].description).toEqual('Heart specialists');
    expect(result[0].company_id).toEqual(company.id);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);

    expect(result[1].name).toEqual('Neurology');
    expect(result[1].description).toEqual('Brain specialists');
  });

  it('should return departments filtered by company_id', async () => {
    // Create two companies
    const [company1] = await db.insert(companiesTable)
      .values({
        name: 'Clinic One',
        address: '123 Test St',
        phone: '555-0123',
        email: 'test1@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    const [company2] = await db.insert(companiesTable)
      .values({
        name: 'Clinic Two',
        address: '456 Test Ave',
        phone: '555-0456',
        email: 'test2@clinic.com',
        license_number: 'LIC456'
      })
      .returning()
      .execute();

    // Create departments for both companies
    await db.insert(departmentsTable)
      .values([
        {
          company_id: company1.id,
          name: 'Emergency',
          description: 'Emergency care'
        },
        {
          company_id: company2.id,
          name: 'Surgery',
          description: 'Surgical procedures'
        }
      ])
      .execute();

    const result = await getDepartments(company1.id);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Emergency');
    expect(result[0].company_id).toEqual(company1.id);
  });

  it('should return empty array when no departments exist', async () => {
    const result = await getDepartments();

    expect(result).toHaveLength(0);
  });

  it('should return empty array when filtering by non-existent company', async () => {
    // Create test company with departments
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Test St',
        phone: '555-0123',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    await db.insert(departmentsTable)
      .values({
        company_id: company.id,
        name: 'Radiology',
        description: 'Imaging services'
      })
      .execute();

    const result = await getDepartments(999); // Non-existent company ID

    expect(result).toHaveLength(0);
  });

  it('should handle departments with null description', async () => {
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Test St',
        phone: '555-0123',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    await db.insert(departmentsTable)
      .values({
        company_id: company.id,
        name: 'General',
        description: null
      })
      .execute();

    const result = await getDepartments();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('General');
    expect(result[0].description).toBeNull();
  });
});
