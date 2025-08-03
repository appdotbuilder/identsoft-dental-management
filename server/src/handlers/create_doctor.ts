
import { db } from '../db';
import { doctorsTable } from '../db/schema';
import { type CreateDoctorInput, type Doctor } from '../schema';

export const createDoctor = async (input: CreateDoctorInput): Promise<Doctor> => {
  try {
    // Insert doctor record
    const result = await db.insert(doctorsTable)
      .values({
        company_id: input.company_id,
        department_id: input.department_id,
        first_name: input.first_name,
        last_name: input.last_name,
        email: input.email,
        phone: input.phone,
        specialization: input.specialization,
        license_number: input.license_number
      })
      .returning()
      .execute();

    const doctor = result[0];
    return doctor;
  } catch (error) {
    console.error('Doctor creation failed:', error);
    throw error;
  }
};
