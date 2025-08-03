
import { db } from '../db';
import { prescriptionsTable } from '../db/schema';
import { type CreatePrescriptionInput, type Prescription } from '../schema';

export const createPrescription = async (input: CreatePrescriptionInput): Promise<Prescription> => {
  try {
    // Insert prescription record
    const result = await db.insert(prescriptionsTable)
      .values({
        patient_id: input.patient_id,
        doctor_id: input.doctor_id,
        case_study_id: input.case_study_id || null,
        medication_name: input.medication_name,
        dosage: input.dosage,
        frequency: input.frequency,
        duration: input.duration,
        instructions: input.instructions || null
      })
      .returning()
      .execute();

    const prescription = result[0];
    return prescription;
  } catch (error) {
    console.error('Prescription creation failed:', error);
    throw error;
  }
};
