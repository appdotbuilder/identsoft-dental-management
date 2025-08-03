
import { db } from '../db';
import { caseStudiesTable } from '../db/schema';
import { type CreateCaseStudyInput, type CaseStudy } from '../schema';

export const createCaseStudy = async (input: CreateCaseStudyInput): Promise<CaseStudy> => {
  try {
    // Insert case study record
    const result = await db.insert(caseStudiesTable)
      .values({
        patient_id: input.patient_id,
        doctor_id: input.doctor_id,
        title: input.title,
        diagnosis: input.diagnosis,
        treatment_plan: input.treatment_plan,
        notes: input.notes || null
      })
      .returning()
      .execute();

    const caseStudy = result[0];
    return {
      ...caseStudy,
      notes: caseStudy.notes || null
    };
  } catch (error) {
    console.error('Case study creation failed:', error);
    throw error;
  }
};
