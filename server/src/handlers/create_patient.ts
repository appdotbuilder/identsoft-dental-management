
import { db } from '../db';
import { patientsTable } from '../db/schema';
import { type CreatePatientInput, type Patient } from '../schema';

export const createPatient = async (input: CreatePatientInput): Promise<Patient> => {
  try {
    // Insert patient record - convert Date to string for date column
    const result = await db.insert(patientsTable)
      .values({
        company_id: input.company_id,
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email || null,
        phone: input.phone,
        date_of_birth: input.date_of_birth.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        address: input.address,
        insurance_number: input.insurance_number || null,
        emergency_contact: input.emergency_contact || null
      })
      .returning()
      .execute();

    // Convert date string back to Date object before returning
    const patient = result[0];
    return {
      ...patient,
      date_of_birth: new Date(patient.date_of_birth) // Convert string back to Date
    };
  } catch (error) {
    console.error('Patient creation failed:', error);
    throw error;
  }
};
