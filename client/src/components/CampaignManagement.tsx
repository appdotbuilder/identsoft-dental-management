
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/utils/trpc';
import { useState, useEffect } from 'react';
import type { Campaign, CreateCampaignInput, Company } from '../../../server/src/schema';

interface CampaignManagementProps {
  companies: Company[];
  selectedCompany: Company | null;
}

export function CampaignManagement({ companies, selectedCompany }: CampaignManagementProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCampaignInput>({
    company_id: selectedCompany?.id || 0,
    name: '',
    type: 'email',
    subject: null,
    message: '',
    scheduled_date: null
  });

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const data = await trpc.getCampaigns.query({ companyId: selectedCompany?.id });
        setCampaigns(data);
      } catch (error) {
        console.error('Failed to load campaigns:', error);
      }
    };
    loadCampaigns();
  }, [selectedCompany]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    
    setIsLoading(true);
    try {
      const campaignData = {
        ...formData,
        company_id: selectedCompany.id
      };
      const newCampaign = await trpc.createCampaign.mutate(campaignData);
      setCampaigns([...campaigns, newCampaign]);
      setFormData({
        company_id: selectedCompany.id,
        name: '',
        type: 'email',
        subject: null,
        message: '',
        scheduled_date: null
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create campaign:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'email' ? '📧' : '📱';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">📧 Communication Campaigns</h2>
          <p className="text-gray-600 mt-1">
            {selectedCompany 
              ? `Manage email and SMS campaigns for ${selectedCompany.name}`
              : 'Send targeted communications to patients'
            }
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-teal-600 hover:bg-teal-700"
              disabled={!selectedCompany}
            >
              ➕ Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Campaign</DialogTitle>
              <DialogDescription>
                Create an email or SMS campaign for patient communication.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Campaign Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCampaignInput) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g. Monthly Dental Check-up Reminder"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Campaign Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'email' | 'sms') =>
                      setFormData((prev: CreateCampaignInput) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">📧 Email Campaign</SelectItem>
                      <SelectItem value="sms">📱 SMS Campaign</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.type === 'email' && (
                  <div className="grid gap-2">
                    <Label htmlFor="subject">Email Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setFormData((prev: CreateCampaignInput) => ({ ...prev, subject: e.target.value || null }))
                      }
                      placeholder="Time for your dental check-up!"
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateCampaignInput) => ({ ...prev, message: e.target.value }))
                    }
                    placeholder={formData.type === 'email' 
                      ? "Dear [Patient Name], it's time for your regular dental check-up..."
                      : "Hi [Patient Name], time for your dental check-up. Call us to schedule!"
                    }
                    rows={5}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="scheduled_date">Schedule for Later (Optional)</Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    value={formData.scheduled_date?.toISOString().split('T')[0] || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCampaignInput) => ({ 
                        ...prev, 
                        scheduled_date: e.target.value ? new Date(e.target.value) : null 
                      }))
                    }
                  />
                  <p className="text-xs text-gray-500">
                    Leave empty to send immediately
                  </p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 Campaign will be sent to all patients registered with {selectedCompany?.name || 'the clinic'}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Campaign'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {!selectedCompany && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-amber-800">
              <span>⚠️</span>
              <p>Please select a clinic from the Clinics tab to manage campaigns.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">📧</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedCompany ? 'No campaigns created yet' : 'No campaigns found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedCompany 
                ? 'Create your first communication campaign to engage with patients.'
                : 'Select a clinic to view and manage campaigns.'
              }
            </p>
            {selectedCompany && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Create Your First Campaign</Button>
                </DialogTrigger>
              </Dialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((campaign: Campaign) => {
            const company = companies.find(c => c.id === campaign.company_id);
            const isScheduled = campaign.scheduled_date && campaign.scheduled_date > new Date();
            
            return (
              <Card key={campaign.id} className="hover:shadow-md transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">{getTypeIcon(campaign.type)}</span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">{campaign.name}</CardTitle>
                        <CardDescription>
                          {campaign.type.toUpperCase()} • {company?.name || 'Unknown Clinic'}
                          {campaign.subject && ` • "${campaign.subject}"`}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isScheduled && <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>}
                      <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-sm text-gray-700 mb-2">Message Content</h4>
                      <p className="text-sm text-gray-600 whitespace-pre-wrap">
                        {campaign.message}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs font-medium text-blue-600 mb-1">RECIPIENTS</p>
                        <p className="text-lg font-bold text-blue-800">{campaign.recipient_count}</p>
                      </div>
                      {campaign.scheduled_date && (
                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <p className="text-xs font-medium text-yellow-600 mb-1">SCHEDULED FOR</p>
                          <p className="text-sm font-semibold text-yellow-800">
                            {campaign.scheduled_date.toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      {campaign.sent_date && (
                        <div className="bg-green-50 p-3 rounded-lg">
                          <p className="text-xs font-medium text-green-600 mb-1">SENT ON</p>
                          <p className="text-sm font-semibold text-green-800">
                            {campaign.sent_date.toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-2 border-t">
                      <span>Created: {campaign.created_at.toLocaleDateString()}</span>
                      <span className="capitalize">{campaign.type} Campaign</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
