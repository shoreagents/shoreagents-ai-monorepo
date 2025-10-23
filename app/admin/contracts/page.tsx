'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  FileText, 
  Search, 
  Filter,
  Eye,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Building,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';

interface Contract {
  id: string;
  staffUserId: string;
  staffUser: {
    id: string;
    name: string;
    email: string;
    company: {
      companyName: string;
    };
  };
  jobTitle: string;
  salary: number;
  currency: string;
  startDate: string;
  signed: boolean;
  signedAt?: string;
  createdAt: string;
}

export default function AdminContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'signed' | 'pending'>('all');

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/contracts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch contracts');
      }
      
      const data = await response.json();
      setContracts(data);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      // For now, show mock data
      setContracts([
        {
          id: '1',
          staffUserId: 'staff-1',
          staffUser: {
            id: 'staff-1',
            name: 'John Doe',
            email: 'john@example.com',
            company: {
              companyName: 'TechCorp Solutions'
            }
          },
          jobTitle: 'Software Developer',
          salary: 50000,
          currency: 'USD',
          startDate: '2024-01-15',
          signed: false,
          createdAt: '2024-01-10'
        },
        {
          id: '2',
          staffUserId: 'staff-2',
          staffUser: {
            id: 'staff-2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            company: {
              companyName: 'Innovation Inc'
            }
          },
          jobTitle: 'Project Manager',
          salary: 60000,
          currency: 'USD',
          startDate: '2024-01-20',
          signed: true,
          signedAt: '2024-01-18',
          createdAt: '2024-01-12'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.staffUser.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.staffUser.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.jobTitle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || 
                          (filterStatus === 'signed' && contract.signed) ||
                          (filterStatus === 'pending' && !contract.signed);
    
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (contract: Contract) => {
    if (contract.signed) {
      return (
        <Badge variant="default" className="bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Signed
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-yellow-600">
        <Clock className="h-3 w-3 mr-1" />
        Pending
      </Badge>
    );
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Employment Contracts</h1>
          <p className="text-slate-300 mt-1">Manage and view all employment contracts</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-slate-300 border-slate-600">
            {contracts.length} Total
          </Badge>
          <Badge variant="outline" className="text-slate-300 border-slate-600">
            {contracts.filter(c => c.signed).length} Signed
          </Badge>
        </div>
      </div>

      {/* Search and Filter */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search contracts by name, email, or job title..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                className={filterStatus === 'all' ? 'bg-purple-600' : 'border-slate-600 text-slate-300'}
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'pending' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('pending')}
                className={filterStatus === 'pending' ? 'bg-yellow-600' : 'border-slate-600 text-slate-300'}
              >
                Pending
              </Button>
              <Button
                variant={filterStatus === 'signed' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('signed')}
                className={filterStatus === 'signed' ? 'bg-green-600' : 'border-slate-600 text-slate-300'}
              >
                Signed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contracts List */}
      {filteredContracts.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-8">
            <div className="text-center">
              <FileText className="h-12 w-12 text-slate-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Contracts Found</h3>
              <p className="text-slate-300">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No contracts match your current filters.' 
                  : 'No employment contracts have been created yet.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredContracts.map((contract) => (
            <Card key={contract.id} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-slate-400" />
                        <span className="font-medium text-white">{contract.staffUser.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-300">{contract.staffUser.company.companyName}</span>
                      </div>
                      {getStatusBadge(contract)}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="text-sm text-slate-400">Position</label>
                        <p className="text-white font-medium">{contract.jobTitle}</p>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400">Salary</label>
                        <p className="text-white font-medium">{contract.currency} {contract.salary.toLocaleString()}</p>
                      </div>
                      <div>
                        <label className="text-sm text-slate-400">Start Date</label>
                        <p className="text-white font-medium">{new Date(contract.startDate).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {contract.signedAt && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <CheckCircle className="h-4 w-4" />
                        <span>Signed on {new Date(contract.signedAt).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <Link href={`/admin/contracts/${contract.id}`}>
                      <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
