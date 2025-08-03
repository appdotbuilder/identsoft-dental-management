
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { companiesTable, campaignsTable } from '../db/schema';
import { type CreateCompanyInput, type CreateCampaignInput } from '../schema';
import { getCampaigns } from '../handlers/get_campaigns';

// Test data
const testCompany1: CreateCompanyInput = {
  name: 'Test Clinic 1',
  address: '123 Main St',
  phone: '555-0001',
  email: 'clinic1@test.com',
  license_number: 'LIC001'
};

const testCompany2: CreateCompanyInput = {
  name: 'Test Clinic 2',
  address: '456 Oak Ave',
  phone: '555-0002',
  email: 'clinic2@test.com',
  license_number: 'LIC002'
};

const testCampaign1: CreateCampaignInput = {
  company_id: 1,
  name: 'Health Reminder Campaign',
  type: 'email',
  subject: 'Annual Checkup Reminder',
  message: 'Time for your annual checkup!'
};

const testCampaign2: CreateCampaignInput = {
  company_id: 1,
  name: 'SMS Alert Campaign',
  type: 'sms',
  message: 'Your appointment is tomorrow at 2 PM'
};

const testCampaign3: CreateCampaignInput = {
  company_id: 2,
  name: 'Vaccination Drive',
  type: 'email',
  subject: 'Vaccination Campaign',
  message: 'Get vaccinated today!'
};

describe('getCampaigns', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all campaigns when no company filter provided', async () => {
    // Create test companies
    const company1Result = await db.insert(companiesTable)
      .values(testCompany1)
      .returning()
      .execute();
    
    const company2Result = await db.insert(companiesTable)
      .values(testCompany2)
      .returning()
      .execute();

    // Create test campaigns
    await db.insert(campaignsTable)
      .values([
        { ...testCampaign1, company_id: company1Result[0].id },
        { ...testCampaign2, company_id: company1Result[0].id },
        { ...testCampaign3, company_id: company2Result[0].id }
      ])
      .execute();

    const result = await getCampaigns();

    expect(result).toHaveLength(3);
    expect(result[0].name).toEqual('Health Reminder Campaign');
    expect(result[0].type).toEqual('email');
    expect(result[0].subject).toEqual('Annual Checkup Reminder');
    expect(result[0].message).toEqual('Time for your annual checkup!');
    expect(result[0].status).toEqual('draft'); // Default status
    expect(result[0].recipient_count).toEqual(0); // Default recipient count
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return campaigns filtered by company', async () => {
    // Create test companies
    const company1Result = await db.insert(companiesTable)
      .values(testCompany1)
      .returning()
      .execute();
    
    const company2Result = await db.insert(companiesTable)
      .values(testCompany2)
      .returning()
      .execute();

    // Create test campaigns
    await db.insert(campaignsTable)
      .values([
        { ...testCampaign1, company_id: company1Result[0].id },
        { ...testCampaign2, company_id: company1Result[0].id },
        { ...testCampaign3, company_id: company2Result[0].id }
      ])
      .execute();

    const result = await getCampaigns(company1Result[0].id);

    expect(result).toHaveLength(2);
    expect(result[0].company_id).toEqual(company1Result[0].id);
    expect(result[1].company_id).toEqual(company1Result[0].id);
    expect(result[0].name).toEqual('Health Reminder Campaign');
    expect(result[1].name).toEqual('SMS Alert Campaign');
  });

  it('should return empty array when no campaigns exist for company', async () => {
    // Create test company
    const companyResult = await db.insert(companiesTable)
      .values(testCompany1)
      .returning()
      .execute();

    const result = await getCampaigns(companyResult[0].id);

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should return empty array when no campaigns exist at all', async () => {
    const result = await getCampaigns();

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle campaign with all optional fields', async () => {
    // Create test company
    const companyResult = await db.insert(companiesTable)
      .values(testCompany1)
      .returning()
      .execute();

    // Create campaign with minimal data (SMS type without subject)
    await db.insert(campaignsTable)
      .values({
        company_id: companyResult[0].id,
        name: 'SMS Only Campaign',
        type: 'sms',
        message: 'Simple SMS message'
      })
      .execute();

    const result = await getCampaigns(companyResult[0].id);

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('SMS Only Campaign');
    expect(result[0].type).toEqual('sms');
    expect(result[0].subject).toBeNull();
    expect(result[0].message).toEqual('Simple SMS message');
    expect(result[0].scheduled_date).toBeNull();
    expect(result[0].sent_date).toBeNull();
  });
});
