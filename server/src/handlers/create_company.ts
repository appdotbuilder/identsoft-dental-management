
import { db } from '../db';
import { companiesTable } from '../db/schema';
import { type CreateCompanyInput, type Company } from '../schema';

export const createCompany = async (input: CreateCompanyInput): Promise<Company> => {
  try {
    // Insert company record
    const result = await db.insert(companiesTable)
      .values({
        name: input.name,
        address: input.address,
        phone: input.phone,
        email: input.email,
        license_number: input.license_number
      })
      .returning()
      .execute();

    // Return the created company
    const company = result[0];
    return company;
  } catch (error) {
    console.error('Company creation failed:', error);
    throw error;
  }
};
