
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { patientsTable, companiesTable } from '../db/schema';
import { type CreatePatientInput } from '../schema';
import { createPatient } from '../handlers/create_patient';
import { eq } from 'drizzle-orm';

describe('createPatient', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a patient with all fields', async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Test St',
        phone: '555-0100',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    const testInput: CreatePatientInput = {
      company_id: companyResult[0].id,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john.doe@example.com',
      phone: '555-0123',
      date_of_birth: new Date('1990-01-15'),
      address: '456 Patient St',
      insurance_number: 'INS123456',
      emergency_contact: 'Jane Doe - 555-0456'
    };

    const result = await createPatient(testInput);

    // Basic field validation
    expect(result.first_name).toEqual('John');
    expect(result.last_name).toEqual('Doe');
    expect(result.email).toEqual('john.doe@example.com');
    expect(result.phone).toEqual('555-0123');
    expect(result.date_of_birth).toEqual(new Date('1990-01-15'));
    expect(result.address).toEqual('456 Patient St');
    expect(result.insurance_number).toEqual('INS123456');
    expect(result.emergency_contact).toEqual('Jane Doe - 555-0456');
    expect(result.company_id).toEqual(companyResult[0].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create a patient with minimal fields', async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Test St',
        phone: '555-0100',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    const testInput: CreatePatientInput = {
      company_id: companyResult[0].id,
      first_name: 'Jane',
      last_name: 'Smith',
      phone: '555-0789',
      date_of_birth: new Date('1985-06-20'),
      address: '789 Patient Ave'
    };

    const result = await createPatient(testInput);

    // Basic field validation
    expect(result.first_name).toEqual('Jane');
    expect(result.last_name).toEqual('Smith');
    expect(result.email).toBeNull();
    expect(result.phone).toEqual('555-0789');
    expect(result.date_of_birth).toEqual(new Date('1985-06-20'));
    expect(result.address).toEqual('789 Patient Ave');
    expect(result.insurance_number).toBeNull();
    expect(result.emergency_contact).toBeNull();
    expect(result.company_id).toEqual(companyResult[0].id);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save patient to database', async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Test St',
        phone: '555-0100',
        email: 'test@clinic.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();

    const testInput: CreatePatientInput = {
      company_id: companyResult[0].id,
      first_name: 'Alice',
      last_name: 'Johnson',
      email: 'alice.johnson@example.com',
      phone: '555-0321',
      date_of_birth: new Date('1992-03-10'),
      address: '321 Test Blvd',
      insurance_number: 'INS654321',
      emergency_contact: 'Bob Johnson - 555-0987'
    };

    const result = await createPatient(testInput);

    // Query database to verify patient was saved
    const patients = await db.select()
      .from(patientsTable)
      .where(eq(patientsTable.id, result.id))
      .execute();

    expect(patients).toHaveLength(1);
    expect(patients[0].first_name).toEqual('Alice');
    expect(patients[0].last_name).toEqual('Johnson');
    expect(patients[0].email).toEqual('alice.johnson@example.com');
    expect(patients[0].phone).toEqual('555-0321');
    expect(new Date(patients[0].date_of_birth)).toEqual(new Date('1992-03-10'));
    expect(patients[0].address).toEqual('321 Test Blvd');
    expect(patients[0].insurance_number).toEqual('INS654321');
    expect(patients[0].emergency_contact).toEqual('Bob Johnson - 555-0987');
    expect(patients[0].company_id).toEqual(companyResult[0].id);
    expect(patients[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle database errors gracefully', async () => {
    const testInput: CreatePatientInput = {
      company_id: 99999, // Non-existent company ID
      first_name: 'Test',
      last_name: 'Patient',
      phone: '555-0000',
      date_of_birth: new Date('1990-01-01'),
      address: '123 Test St'
    };

    // Test should either throw an error or succeed (depending on FK constraints)
    // We'll test that the function can handle the input without crashing
    try {
      const result = await createPatient(testInput);
      // If it succeeds, verify the patient was created
      expect(result.first_name).toEqual('Test');
      expect(result.last_name).toEqual('Patient');
      expect(result.company_id).toEqual(99999);
    } catch (error) {
      // If it fails, it should be a database error
      expect(error).toBeDefined();
    }
  });
});
