
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { campaignsTable, companiesTable } from '../db/schema';
import { type CreateCampaignInput } from '../schema';
import { createCampaign } from '../handlers/create_campaign';
import { eq } from 'drizzle-orm';

describe('createCampaign', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let companyId: number;

  beforeEach(async () => {
    // Create prerequisite company
    const companyResult = await db.insert(companiesTable)
      .values({
        name: 'Test Clinic',
        address: '123 Main St',
        phone: '555-0123',
        email: 'clinic@test.com',
        license_number: 'LIC123'
      })
      .returning()
      .execute();
    
    companyId = companyResult[0].id;
  });

  it('should create an email campaign', async () => {
    const testInput: CreateCampaignInput = {
      company_id: companyId,
      name: 'Monthly Newsletter',
      type: 'email',
      subject: 'Health Tips for December',
      message: 'Stay healthy this winter season!',
      scheduled_date: new Date('2024-12-01T10:00:00Z')
    };

    const result = await createCampaign(testInput);

    // Basic field validation
    expect(result.name).toEqual('Monthly Newsletter');
    expect(result.company_id).toEqual(companyId);
    expect(result.type).toEqual('email');
    expect(result.subject).toEqual('Health Tips for December');
    expect(result.message).toEqual('Stay healthy this winter season!');
    expect(result.status).toEqual('draft');
    expect(result.scheduled_date).toEqual(new Date('2024-12-01T10:00:00Z'));
    expect(result.sent_date).toBeNull();
    expect(result.recipient_count).toEqual(0);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should create an SMS campaign without subject', async () => {
    const testInput: CreateCampaignInput = {
      company_id: companyId,
      name: 'Appointment Reminder',
      type: 'sms',
      message: 'Your appointment is tomorrow at 2 PM'
    };

    const result = await createCampaign(testInput);

    expect(result.name).toEqual('Appointment Reminder');
    expect(result.type).toEqual('sms');
    expect(result.subject).toBeNull();
    expect(result.message).toEqual('Your appointment is tomorrow at 2 PM');
    expect(result.scheduled_date).toBeNull();
    expect(result.status).toEqual('draft');
  });

  it('should save campaign to database', async () => {
    const testInput: CreateCampaignInput = {
      company_id: companyId,
      name: 'Test Campaign',
      type: 'email',
      subject: 'Test Subject',
      message: 'Test message content'
    };

    const result = await createCampaign(testInput);

    // Query using proper drizzle syntax
    const campaigns = await db.select()
      .from(campaignsTable)
      .where(eq(campaignsTable.id, result.id))
      .execute();

    expect(campaigns).toHaveLength(1);
    expect(campaigns[0].name).toEqual('Test Campaign');
    expect(campaigns[0].company_id).toEqual(companyId);
    expect(campaigns[0].type).toEqual('email');
    expect(campaigns[0].subject).toEqual('Test Subject');
    expect(campaigns[0].message).toEqual('Test message content');
    expect(campaigns[0].status).toEqual('draft');
    expect(campaigns[0].recipient_count).toEqual(0);
    expect(campaigns[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle optional fields correctly', async () => {
    const testInput: CreateCampaignInput = {
      company_id: companyId,
      name: 'Simple Campaign',
      type: 'sms',
      message: 'Simple message'
      // No subject or scheduled_date provided
    };

    const result = await createCampaign(testInput);

    expect(result.subject).toBeNull();
    expect(result.scheduled_date).toBeNull();
    expect(result.sent_date).toBeNull();
    expect(result.status).toEqual('draft');
    expect(result.recipient_count).toEqual(0);
  });
});
