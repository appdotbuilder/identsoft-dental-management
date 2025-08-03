
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
import type { Invoice, CreateInvoiceInput, Patient, Company } from '../../../server/src/schema';

interface InvoiceManagementProps {
  patients: Patient[];
  companies: Company[];
  selectedCompany: Company | null;
}

export function InvoiceManagement({ patients, companies, selectedCompany }: InvoiceManagementProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreateInvoiceInput>({
    patient_id: 0,
    company_id: selectedCompany?.id || 0,
    total_amount: 0,
    due_date: new Date(),
    notes: null
  });

  const filteredPatients = selectedCompany 
    ? patients.filter(p => p.company_id === selectedCompany.id)
    : patients;

  useEffect(() => {
    const loadInvoices = async () => {
      try {
        const data = await trpc.getInvoices.query({ companyId: selectedCompany?.id });
        setInvoices(data);
      } catch (error) {
        console.error('Failed to load invoices:', error);
      }
    };
    loadInvoices();
  }, [selectedCompany]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany) return;
    
    setIsLoading(true);
    try {
      const invoiceData = {
        ...formData,
        company_id: selectedCompany.id
      };
      const newInvoice = await trpc.createInvoice.mutate(invoiceData);
      setInvoices([...invoices, newInvoice]);
      setFormData({
        patient_id: 0,
        company_id: selectedCompany.id,
        total_amount: 0,
        due_date: new Date(),
        notes: null
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create invoice:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}-${random}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">💰 Billing & Invoices</h2>
          <p className="text-gray-600 mt-1">
            {selectedCompany 
              ? `Manage invoices and payments for ${selectedCompany.name}`
              : 'Manage patient billing and invoice tracking'
            }
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700"
              disabled={!selectedCompany || filteredPatients.length === 0}
            >
              ➕ Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Generate a new invoice for patient services.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Patient *</Label>
                  <Select
                    value={formData.patient_id.toString()}
                    onValueChange={(value: string) =>
                      setFormData((prev: CreateInvoiceInput) => ({ ...prev, patient_id: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredPatients.map((patient: Patient) => (
                        <SelectItem key={patient.id} value={patient.id.toString()}>
                          {patient.first_name} {patient.last_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="total_amount">Total Amount ($) *</Label>
                  <Input
                    id="total_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.total_amount}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateInvoiceInput) => ({ ...prev, total_amount: parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="due_date">Due Date *</Label>
                  <Input
                    id="due_date"
                    type="date"
                    value={formData.due_date.toISOString().split('T')[0]}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData((prev: CreateInvoiceInput) => ({ ...prev, due_date: new Date(e.target.value) }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setFormData((prev: CreateInvoiceInput) => ({ ...prev, notes: e.target.value || null }))
                    }
                    placeholder="Invoice description, services provided, etc..."
                    rows={3}
                  />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 Invoice number will be auto-generated: {generateInvoiceNumber()}
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Invoice'}
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
              <p>Please select a clinic from the Clinics tab to manage invoices.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {selectedCompany && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                ${invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.paid_amount, 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Total Paid</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">
                ${invoices.reduce((sum, i) => sum + i.total_amount, 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Total Invoiced</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-red-600">
                {invoices.filter(i => i.status === 'overdue').length}
              </div>
              <p className="text-xs text-muted-foreground">Overdue Invoices</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-orange-600">
                ${invoices.reduce((sum, i) => sum + (i.total_amount - i.paid_amount), 0).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">Outstanding</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Invoices List */}
      {invoices.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-6xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {selectedCompany ? 'No invoices created yet' : 'No invoices found'}
            </h3>
            <p className="text-gray-600 mb-4">
              {selectedCompany && filteredPatients.length > 0
                ? 'Create your first invoice to start billing patients.'
                : 'Select a clinic and ensure you have patients registered.'
              }
            </p>
            {selectedCompany && filteredPatients.length > 0 && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Create Your First Invoice</Button>
                </DialogTrigger>
              </Dialog>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {invoices.map((invoice: Invoice) => {
            const patient = patients.find(p => p.id === invoice.patient_id);
            const company = companies.find(c => c.id === invoice.company_id);
            const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status !== 'paid';
            const balance = invoice.total_amount - invoice.paid_amount;
            
            return (
              <Card key={invoice.id} className={`hover:shadow-md transition-all ${isOverdue ? 'border-red-200 bg-red-50' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <span className="text-2xl">💰</span>
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          Invoice #{invoice.invoice_number}
                        </CardTitle>
                        <CardDescription>
                          Patient: {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown Patient'} | 
                          Clinic: {company?.name || 'Unknown Clinic'}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isOverdue && <Badge className="bg-red-100 text-red-800">Overdue</Badge>}
                      <Badge className={getStatusColor(invoice.status)}>
                        {invoice.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-1">Total Amount</p>
                      <p className="text-2xl font-bold text-gray-900">${invoice.total_amount.toFixed(2)}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-green-700 mb-1">Paid Amount</p>
                      <p className="text-2xl font-bold text-green-800">${invoice.paid_amount.toFixed(2)}</p>
                    </div>
                    <div className={`p-4 rounded-lg ${balance > 0 ? 'bg-orange-50' : 'bg-gray-50'}`}>
                      <p className={`text-sm font-medium mb-1 ${balance > 0 ? 'text-orange-700' : 'text-gray-700'}`}>
                        Balance Due
                      </p>
                      <p className={`text-2xl font-bold ${balance > 0 ? 'text-orange-800' : 'text-gray-500'}`}>
                        ${balance.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>📅 Created: {invoice.created_at.toLocaleDateString()}</span>
                      <span className={`font-medium ${isOverdue ? 'text-red-600' : ''}`}>
                        📅 Due: {invoice.due_date.toLocaleDateString()}
                      </span>
                    </div>
                    {invoice.notes && (
                      <div className="mt-3 bg-blue-50 p-3 rounded-lg">
                        <p className="text-sm text-blue-800">{invoice.notes}</p>
                      </div>
                    )}
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
