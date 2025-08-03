
import { db } from '../db';
import { labReportsTable } from '../db/schema';
import { type CreateLabReportInput, type LabReport } from '../schema';

export const createLabReport = async (input: CreateLabReportInput): Promise<LabReport> => {
  try {
    // Insert lab report record
    const result = await db.insert(labReportsTable)
      .values({
        patient_id: input.patient_id,
        doctor_id: input.doctor_id,
        case_study_id: input.case_study_id || null,
        test_name: input.test_name,
        test_date: input.test_date.toISOString().split('T')[0], // Convert Date to YYYY-MM-DD string
        results: input.results,
        notes: input.notes || null,
        file_path: input.file_path || null
      })
      .returning()
      .execute();

    // Convert string date back to Date object for return
    const labReport = result[0];
    return {
      ...labReport,
      test_date: new Date(labReport.test_date) // Convert string back to Date
    };
  } catch (error) {
    console.error('Lab report creation failed:', error);
    throw error;
  }
};
