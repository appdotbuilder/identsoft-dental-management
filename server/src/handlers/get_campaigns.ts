
import { db } from '../db';
import { campaignsTable } from '../db/schema';
import { type Campaign } from '../schema';
import { eq } from 'drizzle-orm';

export const getCampaigns = async (companyId?: number): Promise<Campaign[]> => {
  try {
    // Build query conditionally
    const query = companyId !== undefined
      ? db.select().from(campaignsTable).where(eq(campaignsTable.company_id, companyId))
      : db.select().from(campaignsTable);

    const results = await query.execute();

    // Return results (no numeric conversions needed for campaigns table)
    return results;
  } catch (error) {
    console.error('Failed to fetch campaigns:', error);
    throw error;
  }
};
