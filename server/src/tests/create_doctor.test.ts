
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { doctorsTable, companiesTable, departmentsTable } from '../db/schema';
import { type CreateDoctorInput } from '../schema';
import { createDoctor } from '../handlers/create_doctor';
import { eq } from 'drizzle-orm';

describe('createDoctor', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let companyId: number;
  let departmentId: number;

  beforeEach(async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Medical St',
        phone: '555-0100',
        email: 'info@testclinic.com',
        license_number: 'CL12345'
      })
      .returning()
      .execute();
    
    companyId = companyResult[0].id;

    // Create prerequisite department
    const departmentResult = await db.insert(departmentsTable)
      .values({
        company_id: companyId,
        name: 'Cardiology',
        description: 'Heart specialists'
      })
      .returning()
      .execute();
    
    departmentId = departmentResult[0].id;
  });

  const testInput: CreateDoctorInput = {
    company_id: 0, // Will be set in test
    department_id: 0, // Will be set in test
    first_name: 'John',
    last_name: 'Smith',
    email: 'john.smith@testclinic.com',
    phone: '555-0101',
    specialization: 'Cardiology',
    license_number: 'MD12345'
  };

  it('should create a doctor', async () => {
    const input = { ...testInput, company_id: companyId, department_id: departmentId };
    const result = await createDoctor(input);

    // Basic field validation
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Smith');
    expect(result.email).toEqual('john.smith@testclinic.com');
    expect(result.phone).toEqual('555-0101');
    expect(result.specialization).toEqual('Cardiology');
    expect(result.license_number).toEqual('MD12345');
    expect(result.company_id).toEqual(companyId);
    expect(result.department_id).toEqual(departmentId);
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save doctor to database', async () => {
    const input = { ...testInput, company_id: companyId, department_id: departmentId };
    const result = await createDoctor(input);

    // Query database to verify doctor was saved
    const doctors = await db.select()
      .from(doctorsTable)
      .where(eq(doctorsTable.id, result.id))
      .execute();

    expect(doctors).toHaveLength(1);
    expect(doctors[0].first_name).toEqual('John');
    expect(doctors[0].last_name).toEqual('Smith');
    expect(doctors[0].email).toEqual('john.smith@testclinic.com');
    expect(doctors[0].phone).toEqual('555-0101');
    expect(doctors[0].specialization).toEqual('Cardiology');
    expect(doctors[0].license_number).toEqual('MD12345');
    expect(doctors[0].company_id).toEqual(companyId);
    expect(doctors[0].department_id).toEqual(departmentId);
    expect(doctors[0].is_active).toEqual(true);
    expect(doctors[0].created_at).toBeInstanceOf(Date);
  });

  it('should create multiple doctors successfully', async () => {
    const input1 = { ...testInput, company_id: companyId, department_id: departmentId };
    const input2 = { 
      ...testInput, 
      company_id: companyId, 
      department_id: departmentId,
      first_name: 'Jane',
      last_name: 'Doe',
      email: 'jane.doe@testclinic.com',
      license_number: 'MD54321'
    };

    const result1 = await createDoctor(input1);
    const result2 = await createDoctor(input2);

    expect(result1.id).toBeDefined();
    expect(result2.id).toBeDefined();
    expect(result1.id).not.toEqual(result2.id);

    // Verify both doctors exist in database
    const doctors = await db.select()
      .from(doctorsTable)
      .execute();

    expect(doctors).toHaveLength(2);
  });

  it('should set default is_active to true', async () => {
    const input = { ...testInput, company_id: companyId, department_id: departmentId };
    const result = await createDoctor(input);

    expect(result.is_active).toEqual(true);

    // Verify in database
    const doctor = await db.select()
      .from(doctorsTable)
      .where(eq(doctorsTable.id, result.id))
      .execute();

    expect(doctor[0].is_active).toEqual(true);
  });
});
