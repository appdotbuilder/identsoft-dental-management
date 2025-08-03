
import { db } from '../db';
import { departmentsTable } from '../db/schema';
import { type CreateDepartmentInput, type Department } from '../schema';

export const createDepartment = async (input: CreateDepartmentInput): Promise<Department> => {
  try {
    // Insert department record
    const result = await db.insert(departmentsTable)
      .values({
        company_id: input.company_id,
        name: input.name,
        description: input.description || null
      })
      .returning()
      .execute();

    const department = result[0];
    return department;
  } catch (error) {
    console.error('Department creation failed:', error);
    throw error;
  }
};
