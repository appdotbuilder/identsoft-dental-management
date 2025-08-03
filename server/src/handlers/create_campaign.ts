
import { db } from '../db';
import { campaignsTable } from '../db/schema';
import { type CreateCampaignInput, type Campaign } from '../schema';

export const createCampaign = async (input: CreateCampaignInput): Promise<Campaign> => {
  try {
    // Insert campaign record
    const result = await db.insert(campaignsTable)
      .values({
        company_id: input.company_id,
        name: input.name,
        type: input.type,
        subject: input.subject || null,
        message: input.message,
        scheduled_date: input.scheduled_date || null
      })
      .returning()
      .execute();

    const campaign = result[0];
    return {
      ...campaign,
      // Convert scheduled_date and sent_date to nullable Date types
      scheduled_date: campaign.scheduled_date ? new Date(campaign.scheduled_date) : null,
      sent_date: campaign.sent_date ? new Date(campaign.sent_date) : null
    };
  } catch (error) {
    console.error('Campaign creation failed:', error);
    throw error;
  }
};
