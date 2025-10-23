'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  Clock, 
  User, 
  Calendar,
  Building,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  Eye,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

interface Contract {
  id: string;
  staffUserId: string;
  staffUser: {
    id: string;
    name: string;
    email: string;
    company: {
      companyName: string;
      address: string;
      phone: string;
      email: string;
    };
  };
  jobTitle: string;
  salary: number;
  currency: string;
  startDate: string;
  endDate?: string;
  workType: string;
  workArrangement: string;
  hmoStatus: boolean;
  benefits: string[];
  contractHtml: string;
  signed: boolean;
  signedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminContractViewPage() {
  const params = useParams();
  const contractId = params.contractId as string;
  
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    if (contractId) {
      fetchContract();
    }
  }, [contractId]);

  const fetchContract = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/contracts/${contractId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contract');
      }
      
      const data = await response.json();
      setContract(data);
    } catch (error) {
      console.error('Error fetching contract:', error);
      toast.error('Failed to load contract details');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveContract = async () => {
    try {
      setApproving(true);
      const response = await fetch(`/api/admin/contracts/${contractId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to approve contract');
      }

      toast.success('Contract approved successfully!');
      await fetchContract(); // Refresh contract data
    } catch (error) {
      console.error('Error approving contract:', error);
      toast.error('Failed to approve contract');
    } finally {
      setApproving(false);
    }
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download functionality
    toast.info('PDF download feature coming soon!');
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-2 border-dashed border-red-400 bg-slate-800">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-600/20">
                <FileText className="h-10 w-10 text-red-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Contract Not Found</h3>
              <p className="text-lg text-slate-300 mb-4 max-w-md mx-auto">
                The requested contract could not be found. This contract may have been deleted or the ID is incorrect.
              </p>
              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 max-w-md mx-auto">
                <h4 className="font-semibold text-white mb-2">Possible reasons:</h4>
                <ul className="text-sm text-slate-300 space-y-1 text-left">
                  <li>• Contract ID is incorrect</li>
                  <li>• Contract has been deleted</li>
                  <li>• Contract hasn't been generated yet</li>
                  <li>• Access permissions issue</li>
                </ul>
              </div>
              <div className="mt-6">
                <Button 
                  onClick={() => window.history.back()} 
                  variant="outline"
                  className="bg-slate-700 hover:bg-slate-600 border-slate-500 text-white"
                >
                  Go Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Contract Details</h1>
          <p className="text-gray-600 mt-1">Employment contract for {contract.staffUser.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={contract.signed ? "default" : "secondary"}>
            {contract.signed ? (
              <>
                <CheckCircle className="h-4 w-4 mr-1" />
                Signed
              </>
            ) : (
              <>
                <Clock className="h-4 w-4 mr-1" />
                Pending Signature
              </>
            )}
          </Badge>
        </div>
      </div>

      {/* Contract Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Staff Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Staff Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-gray-900">{contract.staffUser.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Email</label>
              <p className="text-gray-900">{contract.staffUser.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Company</label>
              <p className="text-gray-900">{contract.staffUser.company.companyName}</p>
            </div>
          </CardContent>
        </Card>

        {/* Job Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Job Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Position</label>
              <p className="text-gray-900">{contract.jobTitle}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Salary</label>
              <p className="text-gray-900">{contract.currency} {contract.salary.toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Work Type</label>
              <p className="text-gray-900">{contract.workType}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Arrangement</label>
              <p className="text-gray-900">{contract.workArrangement}</p>
            </div>
          </CardContent>
        </Card>

        {/* Contract Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Contract Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Start Date</label>
              <p className="text-gray-900">{new Date(contract.startDate).toLocaleDateString()}</p>
            </div>
            {contract.endDate && (
              <div>
                <label className="text-sm font-medium text-gray-500">End Date</label>
                <p className="text-gray-900">{new Date(contract.endDate).toLocaleDateString()}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">HMO Status</label>
              <p className="text-gray-900">{contract.hmoStatus ? 'Included' : 'Not Included'}</p>
            </div>
            {contract.signedAt && (
              <div>
                <label className="text-sm font-medium text-gray-500">Signed At</label>
                <p className="text-gray-900">{new Date(contract.signedAt).toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Benefits */}
      {contract.benefits && contract.benefits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Benefits</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc list-inside space-y-1">
              {contract.benefits.map((benefit, index) => (
                <li key={index} className="text-gray-700">{benefit}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Contract HTML Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Contract Document
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4 bg-gray-50">
            <div 
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: contract.contractHtml }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleDownloadPDF}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </Button>
            
            {!contract.signed && (
              <Button
                onClick={handleApproveContract}
                disabled={approving}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
              >
                {approving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Approving...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Approve Contract
                  </>
                )}
              </Button>
            )}
            
            {contract.signed && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium">Contract has been signed</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
