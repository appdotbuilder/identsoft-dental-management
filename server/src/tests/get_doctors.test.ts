
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, departmentsTable, doctorsTable } from '../db/schema';
import { type CreateCompanyInput, type CreateDepartmentInput, type CreateDoctorInput } from '../schema';
import { getDoctors } from '../handlers/get_doctors';

describe('getDoctors', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all doctors when no filters are provided', async () => {
    // Create test company
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St',
        phone: '555-0100',
        email: 'test@clinic.com',
        license_number: 'LIC001'
      })
      .returning()
      .execute();

    // Create test department
    const [department] = await db.insert(departmentsTable)
      .values({
        company_id: company.id,
        name: 'Cardiology',
        description: 'Heart care department'
      })
      .returning()
      .execute();

    // Create test doctors
    await db.insert(doctorsTable)
      .values([
        {
          company_id: company.id,
          department_id: department.id,
          first_name: 'John',
          last_name: 'Smith',
          email: 'john.smith@clinic.com',
          phone: '555-0101',
          specialization: 'Cardiology',
          license_number: 'DOC001'
        },
        {
          company_id: company.id,
          department_id: department.id,
          first_name: 'Jane',
          last_name: 'Doe',
          email: 'jane.doe@clinic.com',
          phone: '555-0102',
          specialization: 'Cardiology',
          license_number: 'DOC002'
        }
      ])
      .execute();

    const result = await getDoctors();

    expect(result).toHaveLength(2);
    expect(result[0].first_name).toBe('John');
    expect(result[0].last_name).toBe('Smith');
    expect(result[0].email).toBe('john.smith@clinic.com');
    expect(result[0].specialization).toBe('Cardiology');
    expect(result[0].is_active).toBe(true);
    expect(result[1].first_name).toBe('Jane');
    expect(result[1].last_name).toBe('Doe');
  });

  it('should filter doctors by company_id', async () => {
    // Create two test companies
    const [company1] = await db.insert(companiesTable)
      .values({
        name: 'Clinic One',
        address: '123 Main St',
        phone: '555-0100',
        email: 'test1@clinic.com',
        license_number: 'LIC001'
      })
      .returning()
      .execute();

    const [company2] = await db.insert(companiesTable)
      .values({
        name: 'Clinic Two',
        address: '456 Oak Ave',
        phone: '555-0200',
        email: 'test2@clinic.com',
        license_number: 'LIC002'
      })
      .returning()
      .execute();

    // Create departments for both companies
    const [dept1] = await db.insert(departmentsTable)
      .values({
        company_id: company1.id,
        name: 'Cardiology',
        description: 'Heart care'
      })
      .returning()
      .execute();

    const [dept2] = await db.insert(departmentsTable)
      .values({
        company_id: company2.id,
        name: 'Neurology',
        description: 'Brain care'
      })
      .returning()
      .execute();

    // Create doctors for both companies
    await db.insert(doctorsTable)
      .values([
        {
          company_id: company1.id,
          department_id: dept1.id,
          first_name: 'Doctor',
          last_name: 'One',
          email: 'doc1@clinic1.com',
          phone: '555-0101',
          specialization: 'Cardiology',
          license_number: 'DOC001'
        },
        {
          company_id: company2.id,
          department_id: dept2.id,
          first_name: 'Doctor',
          last_name: 'Two',
          email: 'doc2@clinic2.com',
          phone: '555-0201',
          specialization: 'Neurology',
          license_number: 'DOC002'
        }
      ])
      .execute();

    const result = await getDoctors(company1.id);

    expect(result).toHaveLength(1);
    expect(result[0].company_id).toBe(company1.id);
    expect(result[0].first_name).toBe('Doctor');
    expect(result[0].last_name).toBe('One');
    expect(result[0].specialization).toBe('Cardiology');
  });

  it('should filter doctors by department_id', async () => {
    // Create test company
    const [company] = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St',
        phone: '555-0100',
        email: 'test@clinic.com',
        license_number: 'LIC001'
      })
      .returning()
      .execute();

    // Create two departments
    const [cardiology] = await db.insert(departmentsTable)
      .values({
        company_id: company.id,
        name: 'Cardiology',
        description: 'Heart care'
      })
      .returning()
      .execute();

    const [neurology] = await db.insert(departmentsTable)
      .values({
        company_id: company.id,
        name: 'Neurology',
        description: 'Brain care'
      })
      .returning()
      .execute();

    // Create doctors in different departments
    await db.insert(doctorsTable)
      .values([
        {
          company_id: company.id,
          department_id: cardiology.id,
          first_name: 'Heart',
          last_name: 'Doctor',
          email: 'heart@clinic.com',
          phone: '555-0101',
          specialization: 'Cardiology',
          license_number: 'DOC001'
        },
        {
          company_id: company.id,
          department_id: neurology.id,
          first_name: 'Brain',
          last_name: 'Doctor',
          email: 'brain@clinic.com',
          phone: '555-0201',
          specialization: 'Neurology',
          license_number: 'DOC002'
        }
      ])
      .execute();

    const result = await getDoctors(undefined, cardiology.id);

    expect(result).toHaveLength(1);
    expect(result[0].department_id).toBe(cardiology.id);
    expect(result[0].first_name).toBe('Heart');
    expect(result[0].specialization).toBe('Cardiology');
  });

  it('should filter doctors by both company_id and department_id', async () => {
    // Create two companies
    const [company1] = await db.insert(companiesTable)
      .values({
        name: 'Clinic One',
        address: '123 Main St',
        phone: '555-0100',
        email: 'test1@clinic.com',
        license_number: 'LIC001'
      })
      .returning()
      .execute();

    const [company2] = await db.insert(companiesTable)
      .values({
        name: 'Clinic Two',
        address: '456 Oak Ave',
        phone: '555-0200',
        email: 'test2@clinic.com',
        license_number: 'LIC002'
      })
      .returning()
      .execute();

    // Create departments (same name but different companies)
    const [dept1] = await db.insert(departmentsTable)
      .values({
        company_id: company1.id,
        name: 'Cardiology',
        description: 'Heart care at clinic 1'
      })
      .returning()
      .execute();

    const [dept2] = await db.insert(departmentsTable)
      .values({
        company_id: company2.id,
        name: 'Cardiology',
        description: 'Heart care at clinic 2'
      })
      .returning()
      .execute();

    // Create doctors in both departments
    await db.insert(doctorsTable)
      .values([
        {
          company_id: company1.id,
          department_id: dept1.id,
          first_name: 'Doctor',
          last_name: 'AtClinicOne',
          email: 'doc@clinic1.com',
          phone: '555-0101',
          specialization: 'Cardiology',
          license_number: 'DOC001'
        },
        {
          company_id: company2.id,
          department_id: dept2.id,
          first_name: 'Doctor',
          last_name: 'AtClinicTwo',
          email: 'doc@clinic2.com',
          phone: '555-0201',
          specialization: 'Cardiology',
          license_number: 'DOC002'
        }
      ])
      .execute();

    const result = await getDoctors(company1.id, dept1.id);

    expect(result).toHaveLength(1);
    expect(result[0].company_id).toBe(company1.id);
    expect(result[0].department_id).toBe(dept1.id);
    expect(result[0].last_name).toBe('AtClinicOne');
  });

  it('should return empty array when no doctors match filters', async () => {
    const result = await getDoctors(999, 999);
    expect(result).toHaveLength(0);
  });
});
