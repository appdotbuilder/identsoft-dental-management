
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { departmentsTable, companiesTable } from '../db/schema';
import { type CreateDepartmentInput } from '../schema';
import { createDepartment } from '../handlers/create_department';
import { eq } from 'drizzle-orm';

// Test company data
const testCompany = {
  name: 'Test Medical Center',
  address: '123 Healthcare Ave',
  phone: '+1-555-0123',
  email: 'contact@testmedical.com',
  license_number: 'LIC123456'
};

// Simple test input
const testInput: CreateDepartmentInput = {
  company_id: 1, // Will be set after company creation
  name: 'Cardiology',
  description: 'Heart and cardiovascular treatment department'
};

describe('createDepartment', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a department', async () => {
    // Create prerequisite company first
    const companyResult = await db.insert(companiesTable)
      .values(testCompany)
      .returning()
      .execute();
    
    const company = companyResult[0];
    testInput.company_id = company.id;

    const result = await createDepartment(testInput);

    // Basic field validation
    expect(result.name).toEqual('Cardiology');
    expect(result.description).toEqual('Heart and cardiovascular treatment department');
    expect(result.company_id).toEqual(company.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save department to database', async () => {
    // Create prerequisite company first
    const companyResult = await db.insert(companiesTable)
      .values(testCompany)
      .returning()
      .execute();
    
    const company = companyResult[0];
    testInput.company_id = company.id;

    const result = await createDepartment(testInput);

    // Query using proper drizzle syntax
    const departments = await db.select()
      .from(departmentsTable)
      .where(eq(departmentsTable.id, result.id))
      .execute();

    expect(departments).toHaveLength(1);
    expect(departments[0].name).toEqual('Cardiology');
    expect(departments[0].description).toEqual('Heart and cardiovascular treatment department');
    expect(departments[0].company_id).toEqual(company.id);
    expect(departments[0].created_at).toBeInstanceOf(Date);
  });

  it('should create department with null description', async () => {
    // Create prerequisite company first
    const companyResult = await db.insert(companiesTable)
      .values(testCompany)
      .returning()
      .execute();
    
    const company = companyResult[0];

    const inputWithoutDescription: CreateDepartmentInput = {
      company_id: company.id,
      name: 'Emergency'
    };

    const result = await createDepartment(inputWithoutDescription);

    expect(result.name).toEqual('Emergency');
    expect(result.description).toBeNull();
    expect(result.company_id).toEqual(company.id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });
});
