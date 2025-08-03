
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { Company, CreateCompanyInput } from '../../../server/src/schema';

interface CompanyManagementProps {
  companies: Company[];
  onCompaniesChange: (companies: Company[]) => void;
  selectedCompany: Company | null;
  onSelectCompany: (company: Company) => void;
}

export function CompanyManagement({ companies, onCompaniesChange, selectedCompany, onSelectCompany }: CompanyManagementProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCompanyInput>({
    name: '',
    address: '',
    phone: '',
    email: '',
    license_number: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newCompany = await trpc.createCompany.mutate(formData);
      onCompaniesChange([...companies, newCompany]);
      setFormData({
        name: '',
        address: '',
        phone: '',
        email: '',
        license_number: ''
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create company:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">🏥 Dental Clinics</h2>
          <p className="text-gray-600 mt-1">Manage your dental clinic locations and details</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              ➕ Add New Clinic
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Dental Clinic</DialogTitle>
              <DialogDescription>
                Create a new dental clinic profile with all necessary details.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Clinic Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCompanyInput) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="e.g. SmileCare Dental Clinic"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCompanyInput) => ({ ...prev, address: e.target.value }))
                    }
                    placeholder="123 Main Street, City, State"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCompanyInput) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="(555) 123-4567"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCompanyInput) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="info@smilecare.com"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="license">License Number *</Label>
                  <Input
                    id="license"
                    value={formData.license_number}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateCompanyInput) => ({ ...prev, license_number: e.target.value }))
                    }
                    placeholder="DL-12345-2024"
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Clinic'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Companies Grid */}
      {companies.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">🏥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No dental clinics yet</h3>
            <p className="text-gray-600 mb-4">
              Get started by adding your first dental clinic to the system.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>Add Your First Clinic</Button>
              </DialogTrigger>
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company: Company) => (
            <Card 
              key={company.id} 
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedCompany?.id === company.id 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => onSelectCompany(company)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-2xl">🏥</span>
                    </div>
                    <div>
                      <CardTitle className="text-lg">{company.name}</CardTitle>
                      <CardDescription className="text-sm">
                        License: {company.license_number}
                      </CardDescription>
                    </div>
                  </div>
                  {selectedCompany?.id === company.id && (
                    <Badge className="bg-blue-100 text-blue-800">Active</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📍</span>
                    <span>{company.address}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📞</span>
                    <span>{company.phone}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <span className="mr-2">📧</span>
                    <span>{company.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500 pt-2">
                    <span className="mr-2">📅</span>
                    <span>Created: {company.created_at.toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Selected Company Details */}
      {selectedCompany && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ✅ Currently Managing: {selectedCompany.name}
            </CardTitle>
            <CardDescription>
              All operations will be performed for this clinic unless otherwise specified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Contact Information</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">Phone:</span> {selectedCompany.phone}</p>
                  <p><span className="font-medium">Email:</span> {selectedCompany.email}</p>
                  <p><span className="font-medium">Address:</span> {selectedCompany.address}</p>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm text-gray-700 mb-2">Legal Information</h4>
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium">License:</span> {selectedCompany.license_number}</p>
                  <p><span className="font-medium">Established:</span> {selectedCompany.created_at.toLocaleDateString()}</p>
                  <p><span className="font-medium">Last Updated:</span> {selectedCompany.updated_at.toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
